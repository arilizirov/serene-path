import { defineRouting } from "next-intl/routing";
import { LOCALES } from "@/lib/utils";

// Single source of truth for locales is the shared kernel (`@/lib/utils`).
// Default locale is `en` (APP_SPEC §6: cookie → Accept-Language → default en).
export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: "en",
});
