"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");

  return (
    <nav aria-label={t("label")} className="flex gap-1">
      {routing.locales.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={
              isActive
                ? "rounded-md bg-primary px-2 py-1 text-sm text-on-primary"
                : "rounded-md px-2 py-1 text-sm text-on-surface-variant hover:bg-surface-container-high"
            }
          >
            {t(locale)}
          </button>
        );
      })}
    </nav>
  );
}
