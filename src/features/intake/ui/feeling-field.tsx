"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "../types";

const PROMPT: Record<Locale, string> = {
  en: "How are you feeling?",
  he: "איך אתם מרגישים?",
  fr: "Comment vous sentez-vous ?",
};

/**
 * The home entry point (F1.2): a person types how they feel and is taken into the
 * intake chat, which auto-sends that first message.
 */
export function FeelingField({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const m = value.trim();
        router.push(m ? `/intake?m=${encodeURIComponent(m)}` : "/intake");
      }}
      className="flex w-full max-w-xl gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PROMPT[locale]}
        aria-label={PROMPT[locale]}
        className="flex-1 rounded-full border border-outline bg-surface px-5 py-3 text-on-surface outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="rounded-full bg-primary px-6 py-3 font-medium text-on-primary transition hover:opacity-90"
      >
        Start
      </button>
    </form>
  );
}
