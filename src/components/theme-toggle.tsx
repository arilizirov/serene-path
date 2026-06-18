"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

// Read the current theme straight from the DOM (the inline script in the layout
// sets `.dark` before paint). useSyncExternalStore keeps the icon in sync
// without a setState-in-effect.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore (private mode / unavailable storage)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("toggle")}
      aria-pressed={dark}
      className="rounded-md px-2 py-1 text-sm text-on-surface-variant hover:bg-surface-container-high"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
