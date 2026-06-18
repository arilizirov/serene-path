/**
 * Public utilities for the shared kernel (`@/lib/utils`).
 * Importable by any module; this region must itself import no feature module.
 */

/** The locales the platform supports (APP_SPEC §6). */
export const LOCALES = ["he", "en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

/** Type guard: is `value` one of the supported locales? */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
