import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listTherapistsForAdmin, setStatusAction } from "@/features/therapists";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";

// Always reflect current DB state (never a build-time snapshot); also avoids
// coupling `next build` to a live database.
export const dynamic = "force-dynamic";

const STATUSES = ["DRAFT", "PENDING", "VERIFIED", "SUSPENDED"];

// NOTE: unprotected until Stage 4 adds auth (BUILD_PLAN dependency chain).
export default async function AdminTherapistsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const rows = await listTherapistsForAdmin();
  return (
    <DashboardShell
      nav={adminNav}
      activeKey="therapists"
      title={t("title.therapists")}
      user={{ name: t("principal") }}
      locale={locale}
      headerRight={
        <Link
          href="/admin/therapists/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
        >
          + New therapist
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
      {rows.length === 0 ? (
        <p className="text-on-surface-variant">No therapists yet.</p>
      ) : (
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-on-surface-variant">
              <th className="py-2 text-start">Name</th>
              <th className="py-2 text-start">Title</th>
              <th className="py-2 text-start">Status</th>
              <th className="py-2 text-start">Languages</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant/40 text-on-surface">
                <td className="py-2">
                  {r.name}
                  <div className="text-xs text-on-surface-variant">{r.email}</div>
                </td>
                <td className="py-2">{r.title}</td>
                <td className="py-2">
                  <form action={setStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <select
                      name="status"
                      defaultValue={r.status}
                      className="rounded-md border border-outline-variant bg-surface-container-lowest px-1 py-0.5 text-xs text-on-surface"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs text-primary underline">
                      Apply
                    </button>
                  </form>
                </td>
                <td className="py-2">{r.languages.join(", ")}</td>
                <td className="py-2 text-end">
                  <Link href={`/admin/therapists/${r.id}`} className="text-primary underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </DashboardShell>
  );
}
