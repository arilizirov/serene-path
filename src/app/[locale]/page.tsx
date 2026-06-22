import { getTranslations } from "next-intl/server";
import { FeelingField } from "@/features/intake";

// Live (the layout reads the session); never prerender at build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <main className="relative flex min-h-[calc(100vh-61px)] flex-col items-center justify-center overflow-hidden p-8">
      {/* Soft sage watercolor wash blooming up from the bottom edge (CSS gradient
          per design/cadence/HANDOFF.md — no raster dependency). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 78% at 50% 120%, var(--accent-soft) 0%, transparent 60%)",
        }}
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
