"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { IntakeResponse, IntakeStateName, TherapistMatch, Locale } from "../types";

type Turn = { role: "user" | "assistant"; content: string };

const ERROR_REPLY: Record<Locale, string> = {
  en: "Something went wrong. Please try again.",
  he: "משהו השתבש. נסו שוב.",
  fr: "Une erreur s'est produite. Veuillez réessayer.",
};

const PLACEHOLDER: Record<Locale, string> = {
  en: "Tell me what's going on…",
  he: "ספרו לי מה עובר עליכם…",
  fr: "Dites-moi ce qui se passe…",
};

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
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);
  const started = useRef(false);

  async function send(message: string) {
    const text = message.trim();
    if (!text || pending) return;
    setInput("");
    setOptions([]);
    setTurns((t) => [...t, { role: "user", content: text }]);
    setPending(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: text, locale }),
      });
      if (!res.ok) throw new Error("intake failed");
      const data: IntakeResponse = await res.json();
      sessionId.current = data.sessionId;
      setState(data.state);
      setMatches(data.matches);
      setOptions(data.options ?? []);
      setTurns((t) => [...t, { role: "assistant", content: data.assistantMessage }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: ERROR_REPLY[locale] }]);
    } finally {
      setPending(false);
    }
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
    <div className="flex flex-col gap-6 lg:flex-row">
      <section className="flex min-h-[24rem] flex-1 flex-col gap-3 rounded-2xl bg-surface-container p-5">
        <div className="flex flex-1 flex-col gap-3">
          {turns.length === 0 && !pending ? (
            <p className="text-on-surface-variant">{PLACEHOLDER[locale]}</p>
          ) : null}
          {turns.map((turn, i) => (
            <div
              key={i}
              className={
                turn.role === "user"
                  ? "self-end rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-on-primary"
                  : "self-start rounded-2xl rounded-bl-sm bg-surface-container-high px-4 py-2 text-on-surface"
              }
            >
              {turn.content}
            </div>
          ))}
          {pending ? (
            <div className="self-start rounded-2xl bg-surface-container-high px-4 py-2 text-on-surface-variant">
              …
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
            Send
          </button>
        </form>
      </section>

      {matches.length > 0 ? (
        <aside className="flex w-full flex-col gap-3 lg:w-80">
          <h2 className="font-heading text-lg font-semibold text-on-background">
            {state === "CLARIFY" ? "" : "Suggested therapists"}
          </h2>
          {matches.map((m) => (
            <Link
              key={m.therapistId}
              href={`/therapists/${m.therapistId}`}
              className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-4 transition hover:opacity-90"
            >
              <p className="text-sm text-on-surface">{m.rationale}</p>
              <span className="text-xs text-primary">View profile →</span>
              {m.nextAvailable ? (
                <span className="text-xs text-on-surface-variant">
                  Next opening:{" "}
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
