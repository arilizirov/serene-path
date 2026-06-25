import { getTranslations } from "next-intl/server";
import { requireRole } from "@/features/accounts";
import { getMyProfileForEdit } from "@/features/therapists";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, PillLink } from "@/components/ui";
import { therapistNav } from "@/components/dashboard-nav";

export const dynamic = "force-dynamic";

// A single "coming soon" stub for the present-but-stubbed therapist nav items
// (calendar, clients, requests, earnings, settings) and the pinned Help link.
// Only Overview and Profile are real this pass; everything else lands here so
// the sidebar reads complete without building those screens out. The active
// pill follows the first path segment when it matches a nav key.
export default async function DashboardStubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  // Auth gate FIRST — therapist-only, same boundary as the rest of the cockpit.
  const { id: userId } = await requireRole("THERAPIST", locale);
  const t = await getTranslations("Dashboard");

  const profile = await getMyProfileForEdit(userId);
  const section = slug[0] ?? "";
  const navItem = therapistNav.find((n) => n.key === section);
  const activeKey = navItem?.key ?? "";
  const sectionLabel = navItem ? t(`nav.${navItem.labelKey}`) : t("nav.help");

  return (
    <DashboardShell
      nav={therapistNav}
      activeKey={activeKey}
      title={sectionLabel}
      user={{ name: profile?.name ?? "" }}
      locale={locale}
    >
      <Card className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-soft-ink">
          {t("soon")}
        </span>
        <h2 className="font-heading text-xl font-semibold text-ink">
          {t("stub.heading", { section: sectionLabel })}
        </h2>
        <p className="text-sm text-ink-2">{t("stub.body")}</p>
        <PillLink variant="primary" href="/dashboard">
          {t("stub.backToOverview")}
        </PillLink>
      </Card>
    </DashboardShell>
  );
}
