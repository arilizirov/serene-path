import { getTranslations } from "next-intl/server";
import { FeelingField } from "@/features/intake";

// Live (the layout reads the session); never prerender at build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <main className="relative flex min-h-[calc(100vh-61px)] flex-col items-center justify-center overflow-hidden p-8">
      {/* Soft sage watercolor wash filling the bottom and fading into the canvas
          (CSS reproduction of design/cadence/assets/wc-pattern — no raster). Sage
          = the accent blended into the bg, so it themes for light + dark. A radial
          bloom adds the watercolor softness over the base vertical wash. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--accent-2) 24%, var(--bg)) 0%, color-mix(in srgb, var(--accent) 13%, var(--bg)) 30%, var(--bg) 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[560px] text-center">
        <h1 className="mb-[30px] font-heading text-[36px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink">
          {t("heading")}
        </h1>
        <FeelingField />
        <div className="mt-[18px] text-[13px] text-ink-3">{t("privacy")}</div>
      </div>
    </main>
  );
}
