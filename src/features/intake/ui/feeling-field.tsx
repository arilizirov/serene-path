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
        {/* Liquid-glass start button: translucent accent gradient with a white
            sheen + frosted blur + a bright rim (border + inset highlight) + a soft
            accent glow. Smaller than the old solid pill. */}
        <button
          onClick={start}
          className="relative whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-accent-ink backdrop-blur-md transition hover:brightness-[1.07] active:scale-95"
          style={{
            background:
              "linear-gradient(155deg, color-mix(in srgb, white 42%, var(--accent)) 0%, color-mix(in srgb, var(--accent) 85%, transparent) 52%, color-mix(in srgb, var(--accent) 72%, transparent) 100%)",
            border: "1px solid color-mix(in srgb, white 55%, transparent)",
            boxShadow:
              "0 6px 18px -6px color-mix(in srgb, var(--accent) 55%, transparent), inset 0 1px 0 0 color-mix(in srgb, white 65%, transparent)",
          }}
        >
          {t("start")} →
        </button>
      </div>
    </div>
  );
}
