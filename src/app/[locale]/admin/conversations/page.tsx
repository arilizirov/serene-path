import { listFinishedSessions } from "@/features/intake";
import { AdminNav } from "../admin-nav";
import { ConversationsTable } from "./conversations-table";
import { PurgeForm } from "./purge-form";

// Always reflect current DB state (transcripts arrive continuously); also avoids
// coupling `next build` to a live database.
export const dynamic = "force-dynamic";

/** First value of a (possibly array) search param. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Transcripts are sensitive (§11): the /admin layout enforces requireRole("ADMIN")
// for this page, and the download route handlers re-check it before serving bytes.
// Manual data deletion (Phase 5) is admin-triggered + confirm-on-submit; each
// delete/purge posts to an action that re-checks requireRole("ADMIN") on its own.
export default async function AdminConversationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const purged = one(sp.purged);
  const purgedDays = one(sp.days);
  const error = one(sp.error);
  const rows = await listFinishedSessions(); // already newest-first
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <AdminNav />
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

      {purged !== undefined && (
        <p className="rounded-lg bg-surface-container px-4 py-2 text-sm text-on-surface">
          Deleted {purged} conversation{purged === "1" ? "" : "s"} older than{" "}
          {purgedDays} days.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="font-heading text-lg font-bold text-on-background">
          Bulk delete (retention)
        </h2>
        <p className="text-sm text-on-surface-variant">
          Manually delete old conversations on demand. Nothing is deleted
          automatically.
        </p>
        <PurgeForm locale={locale} />
      </section>

      {rows.length === 0 ? (
        <p className="text-on-surface-variant">No finished conversations yet.</p>
      ) : (
        <ConversationsTable
          locale={locale}
          rows={rows.map((r) => ({
            id: r.id,
            updatedAt: r.updatedAt.toISOString(),
            state: r.state,
            engine: r.engine,
            turns: r.turns,
            matched: r.matched,
          }))}
        />
      )}
    </main>
  );
}
