"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * The home "chatbox" — the single call to action (F1.2). The person types how
 * they feel and is taken into the intake chat, which auto-sends that first
 * message. Styled as the Cadence chatbox card (design/cadence/HANDOFF.md). The
 * i18n router prefixes the active locale automatically.
 */
export function FeelingField() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [value, setValue] = useState("");

  const start = () => {
    const m = value.trim();
    router.push(m ? `/intake?m=${encodeURIComponent(m)}` : "/intake");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface text-start shadow-card">
      <div className="px-[22px] pb-1 pt-4 font-mono text-[11px] tracking-[0.06em] text-ink-3">
        {t("label")}
      </div>
      <div className="flex items-center gap-3 py-2.5 pe-2.5 ps-[22px]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") start();
          }}
          placeholder={t("placeholder")}
          aria-label={t("heading")}
          className="min-w-0 flex-1 border-none bg-transparent py-2.5 text-[17px] text-ink outline-none placeholder:text-ink-3"
        />
        <button
          onClick={start}
          className="whitespace-nowrap rounded-[10px] bg-accent px-6 py-3 text-[15px] font-medium text-accent-ink transition hover:opacity-90"
        >
          {t("start")} →
        </button>
      </div>
    </div>
  );
}
