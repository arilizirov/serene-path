import { listFinishedSessions } from "@/features/intake";

// Always reflect current DB state (transcripts arrive continuously); also avoids
// coupling `next build` to a live database.
export const dynamic = "force-dynamic";

// Transcripts are sensitive (§11): the /admin layout enforces requireRole("ADMIN")
// for this page, and the download route handlers re-check it before serving bytes.
export default async function AdminConversationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const rows = await listFinishedSessions(); // already newest-first
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Conversations
        </h1>
        {rows.length > 0 && (
          <a
            href={`/${locale}/admin/conversations/download-all`}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            Download all (.md)
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-on-surface-variant">No finished conversations yet.</p>
      ) : (
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-on-surface-variant">
              <th className="py-2 text-start">Date</th>
              <th className="py-2 text-start">State</th>
              <th className="py-2 text-start">Engine</th>
              <th className="py-2 text-start">Turns</th>
              <th className="py-2 text-start">Matched</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant/40 text-on-surface">
                <td className="py-2">{r.updatedAt.toISOString().slice(0, 10)}</td>
                <td className="py-2">{r.state}</td>
                <td className="py-2">{r.engine ?? "—"}</td>
                <td className="py-2">{r.turns}</td>
                <td className="py-2">{r.matched}</td>
                <td className="py-2 text-end">
                  <a
                    href={`/${locale}/admin/conversations/${r.id}/download`}
                    className="text-primary underline"
                  >
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
