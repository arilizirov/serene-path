"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type {
  IntakeResponse,
  IntakeStateName,
  TherapistMatch,
  Locale,
  IntakeEngine,
} from "../types";
import { crisisMessage } from "../crisis";
import {
  ERROR_REPLY,
  TEXT_PLACEHOLDER as PLACEHOLDER,
  SEND_LABEL,
  SUGGESTED_THERAPISTS,
  VIEW_PROFILE,
  NEXT_OPENING,
  ENGINE_AI_LABEL,
  ENGINE_GUIDED_LABEL,
  AI_KEY_NOTICE,
  GET_HELP_NOW_LABEL,
} from "./ui-copy";

type Turn = { role: "user" | "assistant"; content: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Wall clock for pacing. Module-level (not called during render) so it's pure
// from the component's perspective — used only inside the async send handler.
const nowMs = () => Date.now();

export function IntakeChat({
  locale,
  initialMessage,
}: {
  locale: Locale;
  initialMessage?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [matches, setMatches] = useState<TherapistMatch[]>([]);
  const [state, setState] = useState<IntakeStateName>("GREETING");
  const [options, setOptions] = useState<string[]>([]);
  const [engine, setEngineState] = useState<IntakeEngine>("ai");
  const [actualEngine, setActualEngine] = useState<IntakeEngine | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  // Persistent crisis affordance (B2): the AI response carries no secondaryActions,
  // so this UI surfaces the human-authored resources locally, on every turn.
  const [showCrisis, setShowCrisis] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);
  const engineRef = useRef<IntakeEngine>("ai");
  const started = useRef(false);
  const dir = locale === "he" ? "rtl" : "ltr";

  async function send(message: string) {
    const text = message.trim();
    if (!text || pending) return;
    setInput("");
    setOptions([]);
    setTurns((t) => [...t, { role: "user", content: text }]);
    setPending(true);
    const startedAt = nowMs();
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // provider:"api" routes this turn to the AI conversational flow at the seam.
          provider: "api",
          sessionId: sessionId.current,
          message: text,
          locale,
          engine: engineRef.current,
        }),
      });
      if (!res.ok) throw new Error("intake failed");
      const data: IntakeResponse = await res.json();
      // Human pace: never answer instantly. Longer replies "take longer to type".
      const thinkMs = Math.min(2400, 650 + data.assistantMessage.length * 12);
      const elapsed = nowMs() - startedAt;
      if (elapsed < thinkMs) await sleep(thinkMs - elapsed);
      sessionId.current = data.sessionId;
      setState(data.state);
      setMatches(data.matches);
      setOptions(data.options ?? []);
      setActualEngine(data.engine);
      setTurns((t) => [...t, { role: "assistant", content: data.assistantMessage }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: ERROR_REPLY[locale] }]);
    } finally {
      setPending(false);
    }
  }

  // Switching engine starts a fresh conversation; re-run the opening line (if any)
  // under the new engine so the two can be compared on the same input.
  function switchEngine(next: IntakeEngine) {
    if (next === engineRef.current || pending) return;
    engineRef.current = next;
    setEngineState(next);
    sessionId.current = undefined;
    setTurns([]);
    setMatches([]);
    setOptions([]);
    setActualEngine(null);
    setState("GREETING");
    if (initialMessage) void send(initialMessage);
  }

  // Auto-start from the home "how are you feeling?" field (F1.2) — exactly once.
  useEffect(() => {
    if (initialMessage && !started.current) {
      started.current = true;
      void send(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  return (
    <div dir={dir} className="flex flex-col gap-6 lg:flex-row">
      <section className="flex min-h-[24rem] flex-1 flex-col gap-3 rounded-2xl bg-surface-container p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-full border border-outline p-0.5 text-sm">
            {(["ai", "scripted"] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => switchEngine(e)}
                disabled={pending}
                className={
                  engine === e
                    ? "rounded-full bg-primary px-3 py-1 font-medium text-on-primary"
                    : "rounded-full px-3 py-1 text-on-surface-variant disabled:opacity-50"
                }
              >
                {e === "ai" ? ENGINE_AI_LABEL[locale] : ENGINE_GUIDED_LABEL[locale]}
              </button>
            ))}
          </div>
          {engine === "ai" && actualEngine === "scripted" ? (
            <span className="text-xs text-on-surface-variant">
              {AI_KEY_NOTICE[locale]}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          {turns.length === 0 && !pending ? (
            <p className="text-on-surface-variant">{PLACEHOLDER[locale]}</p>
          ) : null}
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
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => void send(opt)}
                className="rounded-full border border-accent bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-soft-ink transition hover:opacity-90"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER[locale]}
            className="flex-1 rounded-full border border-outline bg-surface px-4 py-2 text-on-surface outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="rounded-full bg-primary px-5 py-2 text-on-primary disabled:opacity-50"
          >
            {SEND_LABEL[locale]}
          </button>
        </form>

        {/* Persistent crisis safety net (B2): always visible, every turn, independent
            of any classifier — matches the chip UI's always-on get_help_now button.
            Surfaces the human-authored, owner-verified resources (crisis.ts). */}
        <div className="flex flex-col gap-2 border-t border-outline pt-3">
          <button
            type="button"
            onClick={() => setShowCrisis(true)}
            className="self-start rounded-full bg-[#c0584e] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
          >
            {GET_HELP_NOW_LABEL[locale]}
          </button>
          {showCrisis ? (
            <p className="whitespace-pre-wrap rounded-2xl bg-surface-container-high px-4 py-2 text-sm text-on-surface">
              {crisisMessage(locale)}
            </p>
          ) : null}
        </div>
      </section>

      {matches.length > 0 ? (
        <aside className="flex w-full flex-col gap-3 lg:w-80">
          <h2 className="font-heading text-lg font-semibold text-on-background">
            {state === "CLARIFY" ? "" : SUGGESTED_THERAPISTS[locale]}
          </h2>
          {matches.map((m) => (
            <Link
              key={m.therapistId}
              href={`/therapists/${m.therapistId}`}
              className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-4 transition hover:opacity-90"
            >
              <p className="text-sm text-on-surface">{m.rationale}</p>
              <span className="text-xs text-primary">{VIEW_PROFILE[locale]}</span>
              {m.nextAvailable ? (
                <span className="text-xs text-on-surface-variant">
                  {NEXT_OPENING[locale]}{" "}
                  {new Date(m.nextAvailable).toLocaleString(locale, {
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
