import { getTranslations } from "next-intl/server";
import { FeelingField } from "@/features/intake";

// Live (the layout reads the session); never prerender at build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <main className="relative flex min-h-[calc(100vh-61px)] flex-col items-center justify-center overflow-hidden p-8">
      {/* Brand wave background, anchored to the bottom and covering the hero.
          Two optimized webp assets in /public — light + dark — switched by the
          `.dark` class (only the active theme's image is fetched). The page bg
          (var(--bg)) sits behind, matching each image's plain top. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[url('/home-bg-light.webp')] bg-cover bg-bottom bg-no-repeat dark:bg-[url('/home-bg-dark.webp')]"
      />

      <div className="relative z-10 w-full max-w-[560px] text-center">
        <div className="mb-[18px] font-mono text-xs tracking-[0.14em] text-accent">
          {t("eyebrow")}
        </div>
        <h1 className="mb-[30px] font-heading text-[36px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink">
          {t("heading")}
        </h1>
        <FeelingField />
        <div className="mt-[18px] text-[13px] text-ink-3">{t("privacy")}</div>
      </div>
    </main>
  );
}
