"use client";

import { useState } from "react";
import type { Locale } from "../types";
import { ChipIntakeChat } from "./chip-intake-chat";
import { IntakeChat } from "./intake-chat";

// The intake page offers BOTH interchangeable flows (one IntakeProvider seam, two
// providers): the chip-driven guided flow (DEFAULT) and the AI conversation. This
// client wrapper holds the mode and renders the matching chat; each chat tags its
// own POSTs with the right `provider`, so the route dispatches to the right flow.
// Labels arrive localized from the server page (next-intl), so the toggle is i18n
// + RTL correct alongside the rest of the intake copy.

type Mode = "chip" | "api";

export function IntakeModeSwitch({
  locale,
  initialMessage,
  guidedLabel,
  conversationLabel,
  crisisText,
}: {
  locale: Locale;
  initialMessage?: string;
  guidedLabel: string;
  conversationLabel: string;
  crisisText: string;
}) {
  // Chip (guided) is the default flow.
  const [mode, setMode] = useState<Mode>("chip");
  const dir = locale === "he" ? "rtl" : "ltr";

  const tabs: { mode: Mode; label: string }[] = [
    { mode: "chip", label: guidedLabel },
    { mode: "api", label: conversationLabel },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        dir={dir}
        role="tablist"
        aria-label={`${guidedLabel} / ${conversationLabel}`}
        className="inline-flex self-start rounded-full border border-outline p-0.5 text-sm"
      >
        {tabs.map((t) => (
          <button
            key={t.mode}
            type="button"
            role="tab"
            aria-selected={mode === t.mode}
            onClick={() => setMode(t.mode)}
            className={
              mode === t.mode
                ? "rounded-full bg-primary px-4 py-1 font-medium text-on-primary"
                : "rounded-full px-4 py-1 text-on-surface-variant transition hover:opacity-90"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "chip" ? (
        <ChipIntakeChat locale={locale} initialMessage={initialMessage} />
      ) : (
        <IntakeChat locale={locale} initialMessage={initialMessage} crisisText={crisisText} />
      )}
    </div>
  );
}
