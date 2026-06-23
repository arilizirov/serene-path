import { getMatchingCatalog } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import {
  createSession,
  getSession,
  saveSession,
  type StoredMessage,
} from "./repository";
import { detectConcerns, pickMatch } from "./concerns";
import {
  copy,
  confirmOptions,
  isConfirmNo,
  mirrorMessage,
  buildRationale,
  matchMessage,
} from "./copy";
import type { IntakeResponse, Locale, IntakeStateName, TherapistMatch } from "./types";

// Deterministic scripted intake (from scriptedIntakeProvider.ts), driven by a
// phase persisted on the anonymous session — no model call. Flow:
//   greet (home page) → probe1 → probe2 → respect+mirror+confirm
//   → (MATCH | regather) ; matching scores the REAL verified catalog and the
//   server resolves nextAvailable (the §5 guarantees still hold).
type Phase = "g1" | "g2" | "g3" | "confirm" | "regather" | "done";

export async function runIntakeTurn(input: {
  sessionId?: string;
  message: string;
  locale: Locale;
}): Promise<IntakeResponse> {
  const { locale } = input;
  const c = copy(locale);

  const existing = input.sessionId ? await getSession(input.sessionId) : null;
  const session = existing ?? (await createSession());
  const phase = (session.phase as Phase | null) ?? "g1";

  const messages: StoredMessage[] = [...session.messages];
  messages.push({ role: "user", content: input.message.trim() });
  const answers = messages.filter((m) => m.role === "user").map((m) => m.content);

  let reply: string;
  let state: IntakeStateName;
  let nextPhase: Phase;
  let options: string[] | undefined;
  let matches: TherapistMatch[] = [];

  if (phase === "g1") {
    reply = c.probe1;
    state = "GATHER";
    nextPhase = "g2";
  } else if (phase === "g2") {
    reply = c.probe2;
    state = "GATHER";
    nextPhase = "g3";
  } else if (phase === "g3" || phase === "regather") {
    reply = mirrorMessage(locale, detectConcerns(answers.join(" ")));
    state = "CONFIRM";
    nextPhase = "confirm";
    options = confirmOptions(locale);
  } else if (phase === "confirm") {
    if (isConfirmNo(locale, input.message)) {
      reply = c.notQuite;
      state = "GATHER";
      nextPhase = "regather";
    } else {
      const concerns = detectConcerns(answers.join(" "));
      const catalog = await getMatchingCatalog(locale);
      const picked = pickMatch(catalog, concerns, answers.join(" "), locale);
      if (!picked) {
        reply = c.noMatch;
        state = "CLARIFY";
        nextPhase = "done";
      } else {
        const entry = catalog.find((e) => e.id === picked.id)!;
        const nextAvailable = await getNextAvailable(picked.id, new Date().toISOString());
        const rationale = buildRationale(locale, picked.concept, picked.snippet);
        reply = matchMessage(locale, entry.name, rationale, nextAvailable);
        state = "PRESENT_OPTIONS";
        nextPhase = "done";
        matches = [{ therapistId: picked.id, rationale, nextAvailable }];
      }
    }
  } else {
    reply = c.support;
    state = "FOLLOWUP";
    nextPhase = "done";
  }

  messages.push({ role: "assistant", content: reply });
  await saveSession(session.id, {
    state,
    messages,
    suggestedTherapistIds: matches.map((m) => m.therapistId),
    phase: nextPhase,
  });

  return { sessionId: session.id, assistantMessage: reply, state, matches, options };
}
