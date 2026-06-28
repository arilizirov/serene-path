import { getTranslations } from "next-intl/server";
import { TherapistForm } from "@/features/therapists";
import { AdminShell, AdminPageHead } from "@/components/admin-shell";

export default async function NewTherapistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  return (
    <AdminShell activeKey="therapists">
      <AdminPageHead title={t("title.therapistNew")} />
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <TherapistForm locale={locale} />
      </div>
    </AdminShell>
  );
}
