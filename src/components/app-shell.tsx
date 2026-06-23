"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

type Role = "CLIENT" | "THERAPIST" | "ADMIN";
const LOCALES = ["en", "he", "fr"] as const;
const LOCALE_LABEL: Record<string, string> = { en: "EN", he: "עברית", fr: "FR" };

// Subscribe to the <html> class so the theme button reflects the current theme
// (set pre-paint by the no-flash script) without a setState-in-effect.
function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

/** The Cadence app shell: brand logo + a corner "Menu" dropdown holding the
 *  primary nav, a language segmented control, the theme toggle, and the account
 *  row. Present on every screen (design/cadence/HANDOFF.md). */
export function AppShell({
  locale,
  authedRole,
}: {
  locale: string;
  authedRole: Role | null;
}) {
  const t = useTranslations("Nav");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage blocked — toggles for the session only */
    }
    // The MutationObserver subscription re-renders the icon/label.
  };

  const nav = [
    { href: "/", label: t("home") },
    { href: "/therapists", label: t("find") },
    { href: "/appointments", label: t("appts") },
  ] as const;

  const accountHref =
    authedRole === "THERAPIST"
      ? "/dashboard"
      : authedRole === "ADMIN"
        ? "/admin/therapists"
        : authedRole
          ? "/appointments"
          : "/login";
  const accountName = authedRole ? t("account") : t("signIn");
  const accountInitial = authedRole ? accountName.charAt(0) : "?";

  return (
    <>
      {open ? (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40"
          aria-hidden
        />
      ) : null}

      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-transparent px-6 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Therapli">
          <Image
            src="/therapli-mark.png"
            alt=""
            width={34}
            height={23}
            priority
            className="h-[22px] w-auto"
          />
          <span className="font-heading text-[17px] font-semibold tracking-[-0.01em] text-ink">
            Therapli
          </span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={t("menu")}
            aria-expanded={open}
            className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-ink shadow-card"
          >
            <span className="flex flex-col gap-[3px]">
              <span className="h-0.5 w-4 rounded-sm bg-ink" />
              <span className="h-0.5 w-4 rounded-sm bg-ink" />
              <span className="h-0.5 w-4 rounded-sm bg-ink" />
            </span>
            <span>{t("menu")}</span>
          </button>

          {open ? (
            <div className="absolute end-0 top-[calc(100%+10px)] z-[55] w-[272px] rounded-[14px] border border-border bg-surface p-2.5 shadow-card">
              <nav className="flex flex-col gap-0.5">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-surface-2 text-ink"
                          : "text-ink-2 hover:bg-surface-2"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mx-1 my-2.5 h-px bg-border-2" />

              <div className="px-2 pb-2.5">
                <div className="mb-2 font-mono text-[11px] tracking-[0.06em] text-ink-3">
                  {t("language")}
                </div>
                <div className="flex overflow-hidden rounded-lg border border-border text-xs font-medium">
                  {LOCALES.map((l, i) => {
                    const active = locale === l;
                    return (
                      <button
                        key={l}
                        onClick={() => {
                          setOpen(false);
                          router.replace(pathname, { locale: l });
                        }}
                        className={`flex-1 py-2 text-center ${
                          i > 0 ? "border-s border-border" : ""
                        } ${
                          active
                            ? "bg-accent text-accent-ink"
                            : "text-ink-2 hover:bg-surface-2"
                        }`}
                      >
                        {LOCALE_LABEL[l]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between px-2 pb-2.5">
                <div className="font-mono text-[11px] tracking-[0.06em] text-ink-3">
                  {t("theme")}
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label={t("theme")}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink-2"
                >
                  <span className="text-sm">{dark ? "☀" : "☾"}</span>
                  <span className="font-medium">{dark ? t("light") : t("dark")}</span>
                </button>
              </div>

              <div className="mx-1 mb-2.5 mt-1 h-px bg-border-2" />

              <Link
                href={accountHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 pb-1.5 pt-0.5 hover:bg-surface-2"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent-soft font-heading text-[13px] font-semibold text-accent-soft-ink">
                  {accountInitial}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {accountName}
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
