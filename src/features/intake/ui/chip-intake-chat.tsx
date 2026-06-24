"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { IntakeTurn, IntakeFlowState, IntakeMatch, SecondaryAction } from "../contract";
import type { Locale } from "../types";
import { chipLabel, SECONDARY_LABELS } from "../flow-copy";

type Turn = { role: "user" | "assistant"; content: string };

const ERROR_REPLY: Record<Locale, string> = {
  en: "Something went wrong. Please try again.",
  he: "משהו השתבש. נסו שוב.",
  fr: "Une erreur s'est produite. Veuillez réessayer.",
};
const TEXT_PLACEHOLDER: Record<Locale, string> = {
  en: "Tell me what's going on…",
  he: "ספרו לי מה עובר עליכם…",
  fr: "Dites-moi ce qui se passe…",
};
const SEND_LABEL: Record<Locale, string> = { en: "Send", he: "שליחה", fr: "Envoyer" };
const MATCH_TITLE: Record<Locale, string> = { en: "Your recommended therapist", he: "המטפל/ת המומלץ/ת עבורך", fr: "Votre thérapeute recommandé·e" };
const VIEW_PROFILE: Record<Locale, string> = { en: "View profile →", he: "← לצפייה בפרופיל", fr: "Voir le profil →" };
const NEXT_OPENING: Record<Locale, string> = { en: "Next opening:", he: "מועד פנוי:", fr: "Prochaine disponibilité :" };
const FOLLOWUP_CONFIRM: Record<Locale, string> = {
  en: "Thank you — someone from our team will reach out to you soon.",
  he: "תודה — מישהו מהצוות שלנו ייצור איתך קשר בקרוב.",
  fr: "Merci — un membre de notre équipe vous contactera bientôt.",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowMs = () => Date.now();

export function ChipIntakeChat({ locale, initialMessage }: { locale: Locale; initialMessage?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [secondary, setSecondary] = useState<SecondaryAction[]>([]);
  const [matches, setMatches] = useState<IntakeMatch[]>([]);
  const [state, setState] = useState<IntakeFlowState>("GREETING");
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);
  const started = useRef(false);

  async function post(body: { text?: string; choice?: string; action?: SecondaryAction }, userBubble?: string) {
    if (pending) return;
    if (userBubble) setTurns((t) => [...t, { role: "user", content: userBubble }]);
    setOptions([]);
    setInput("");
    setPending(true);
    const startedAt = nowMs();
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, locale, ...body }),
      });
      if (!res.ok) throw new Error("intake failed");
      const data: IntakeTurn = await res.json();
      const thinkMs = Math.min(2200, 500 + data.assistantMessage.length * 10);
      const elapsed = nowMs() - startedAt;
      if (elapsed < thinkMs) await sleep(thinkMs - elapsed);
      sessionId.current = data.sessionId;
      setState(data.state);
      setOptions(data.options ?? []);
      setSecondary(data.secondaryActions ?? []);
      setMatches(data.matches ?? []);
      setDone(Boolean(data.done) || data.state === "CRISIS");
      setTurns((t) => [...t, { role: "assistant", content: data.assistantMessage }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: ERROR_REPLY[locale] }]);
    } finally {
      setPending(false);
    }
  }

  const sendText = (text: string) => {
    const t = text.trim();
    if (t) void post({ text: t }, t);
  };
  const sendChoice = (id: string) => void post({ choice: id }, chipLabel(locale, id));

  // get_help_now is a real API turn (→ CRISIS resources). browse_all navigates;
  // human_followup is acknowledged client-side (server-side handoff lands in E).
  function onSecondary(action: SecondaryAction) {
    if (action === "get_help_now") return void post({ action }, SECONDARY_LABELS[locale][action]);
    if (action === "human_followup") {
      setTurns((t) => [
        ...t,
        { role: "user", content: SECONDARY_LABELS[locale][action] },
        { role: "assistant", content: FOLLOWUP_CONFIRM[locale] },
      ]);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const opener = initialMessage?.trim();
    void post(opener ? { text: opener } : {}, opener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showText = !done && options.length === 0 && state !== "CRISIS";
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="flex flex-col gap-6 lg:flex-row">
      <section className="flex min-h-[24rem] flex-1 flex-col gap-3 rounded-2xl bg-surface-container p-5">
        <div className="flex flex-1 flex-col gap-3">
          {turns.map((turn, i) => (
            <div
              key={i}
              className={
                turn.role === "user"
                  ? "self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-on-primary"
                  : "self-start whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-surface-container-high px-4 py-2 text-on-surface"
              }
            >
              {turn.content}
            </div>
          ))}
          {pending ? (
            <div className="self-start rounded-2xl rounded-bl-sm bg-surface-container-high px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant" />
              </span>
            </div>
          ) : null}
        </div>

        {options.length > 0 && !pending ? (
          <div className="flex flex-wrap gap-2">
            {options.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => sendChoice(id)}
                className="rounded-full border border-accent bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-soft-ink transition hover:opacity-90"
              >
                {chipLabel(locale, id)}
              </button>
            ))}
          </div>
        ) : null}

        {showText && !pending ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendText(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={TEXT_PLACEHOLDER[locale]}
              className="flex-1 rounded-full border border-outline bg-surface px-4 py-2 text-on-surface outline-none focus:border-primary"
            />
            <button type="submit" disabled={!input.trim()} className="rounded-full bg-primary px-5 py-2 text-on-primary disabled:opacity-50">
              {SEND_LABEL[locale]}
            </button>
          </form>
        ) : null}

        {secondary.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-outline pt-3">
            {secondary.map((a) =>
              a === "browse_all" ? (
                <Link key={a} href="/therapists" className="rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant transition hover:opacity-90">
                  {SECONDARY_LABELS[locale][a]}
                </Link>
              ) : (
                <button
                  key={a}
                  type="button"
                  onClick={() => onSecondary(a)}
                  className={
                    a === "get_help_now"
                      ? "rounded-full bg-[#c0584e] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
                      : "rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant transition hover:opacity-90"
                  }
                >
                  {SECONDARY_LABELS[locale][a]}
                </button>
              ),
            )}
          </div>
        ) : null}
      </section>

      {matches.length > 0 ? (
        <aside className="flex w-full flex-col gap-3 lg:w-80">
          <h2 className="font-heading text-lg font-semibold text-on-background">{MATCH_TITLE[locale]}</h2>
          {matches.map((mm) => (
            <Link
              key={mm.therapistId}
              href={`/therapists/${mm.therapistId}`}
              className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-4 transition hover:opacity-90"
            >
              <p className="text-sm text-on-surface">{mm.rationale}</p>
              <span className="text-xs text-primary">{VIEW_PROFILE[locale]}</span>
              {mm.nextAvailable ? (
                <span className="text-xs text-on-surface-variant">
                  {NEXT_OPENING[locale]}{" "}
                  {new Date(mm.nextAvailable).toLocaleString(locale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Jerusalem",
                  })}
                </span>
              ) : null}
            </Link>
          ))}
        </aside>
      ) : null}
    </div>
  );
}
