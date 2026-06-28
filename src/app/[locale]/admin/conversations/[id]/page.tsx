import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFullSession } from "@/features/intake";
import { AdminShell, AdminPageHead } from "@/components/admin-shell";

// Always reflect current DB state (transcripts arrive continuously) and avoid
// coupling `next build` to a live database.
export const dynamic = "force-dynamic";

// In-portal VIEW of one finished transcript. Coexists with the sibling
// [id]/download/route.ts (a nested route segment, not a collision). Transcripts
// are sensitive (§11): the /admin layout already enforces requireRole("ADMIN")
// for this page, so no extra guard is needed here.
export default async function ConversationViewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("Admin");
  const session = await getFullSession(id);
  if (!session) notFound();

  return (
    <AdminShell activeKey="conversations">
      <AdminPageHead title={t("title.conversation")} />
      <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <a
          href={`/${locale}/admin/conversations`}
          className="text-sm text-primary underline"
        >
          ← Back to conversations
        </a>
        <a
          href={`./${id}/download`}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
        >
          Download .md
        </a>
      </div>

      <header className="flex flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Conversation
        </h1>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-on-surface-variant sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">ID</dt>
            <dd className="break-all">{session.id}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">State</dt>
            <dd>{session.state}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">Created</dt>
            <dd>{session.createdAt.toISOString()}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">Finished</dt>
            <dd>{session.updatedAt.toISOString()}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">Engine</dt>
            <dd>{session.engine ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">Matched</dt>
            <dd>{session.matched.length}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface">Turns</dt>
            <dd>{session.messages.length}</dd>
          </div>
        </dl>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-on-background">
          Transcript
        </h2>
        {session.messages.length === 0 ? (
          <p className="text-on-surface-variant">This conversation is empty.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {session.messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <li
                  key={i}
                  className={
                    isUser
                      ? "rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
                      : "rounded-2xl border border-outline-variant bg-surface-container p-4"
                  }
                >
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    {isUser ? "User" : "Assistant"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-on-surface">
                    {m.content}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      </div>
    </AdminShell>
  );
}
