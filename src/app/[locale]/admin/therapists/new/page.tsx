import { getTranslations } from "next-intl/server";
import { TherapistForm } from "@/features/therapists";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";

export default async function NewTherapistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  return (
    <DashboardShell
      nav={adminNav}
      activeKey="therapists"
      title={t("title.therapistNew")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <TherapistForm locale={locale} />
      </div>
    </DashboardShell>
  );
}
