import { getTranslations } from "next-intl/server";
import { requireRole, getUserContact } from "@/features/accounts";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, PillLink } from "@/components/ui";
import { clientNav } from "@/components/dashboard-nav";

export const dynamic = "force-dynamic";

// A single "coming soon" stub for the present-but-stubbed client nav items
// (my therapist, forms, billing, account settings). Only Overview and
// Appointments are real this pass; everything else lands here so the sidebar
// reads complete without building those screens out. The active pill follows
// the first path segment when it matches a nav key.
export default async function AccountStubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  // Auth gate FIRST — client-only, same boundary as the rest of the account area.
  const { id: userId } = await requireRole("CLIENT", locale);
  // Nav labels + the "soon" badge live in the shared Dashboard catalog (same as
  // the therapist stub); the stub copy lives in the Client catalog.
  const tNav = await getTranslations("Dashboard");
  const t = await getTranslations("Client");

  const contact = await getUserContact(userId);
  const section = slug[0] ?? "";
  const navItem = clientNav.find((n) => n.key === section);
  const activeKey = navItem?.key ?? "";
  const sectionLabel = navItem
    ? tNav(`nav.${navItem.labelKey}`)
    : t("overview.title");

  return (
    <DashboardShell
      nav={clientNav}
      activeKey={activeKey}
      title={sectionLabel}
      user={{ name: contact?.name ?? "" }}
      locale={locale}
    >
      <Card className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-soft-ink">
          {tNav("soon")}
        </span>
        <h2 className="font-heading text-xl font-semibold text-ink">
          {t("stub.heading", { section: sectionLabel })}
        </h2>
        <p className="text-sm text-ink-2">{t("stub.body")}</p>
        <PillLink variant="primary" href="/account">
          {t("stub.backToOverview")}
        </PillLink>
      </Card>
    </DashboardShell>
  );
}
