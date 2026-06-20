import { Link } from "@/i18n/navigation";
import { listTherapistsForAdmin } from "@/features/therapists";

// Always reflect current DB state (never a build-time snapshot); also avoids
// coupling `next build` to a live database.
export const dynamic = "force-dynamic";

// NOTE: unprotected until Stage 4 adds auth (BUILD_PLAN dependency chain).
export default async function AdminTherapistsPage() {
  const rows = await listTherapistsForAdmin();
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Therapists
        </h1>
        <Link
          href="/admin/therapists/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
        >
          + New therapist
        </Link>
      </div>

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
                <td className="py-2">{r.status}</td>
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
    </main>
  );
}
