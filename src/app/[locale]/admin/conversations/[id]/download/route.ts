import { requireRole } from "@/features/accounts";
import { getFullSession, conversationToMarkdown } from "@/features/intake";

// GET /[locale]/admin/conversations/[id]/download — one finished transcript as
// a downloadable `.md`. Transcripts are sensitive (§11): re-check ADMIN here at
// the route boundary (route handlers aren't covered by the /admin layout guard)
// BEFORE touching any session data. requireRole redirects non-admins to login.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; id: string }> },
): Promise<Response> {
  const { locale, id } = await params;
  await requireRole("ADMIN", locale);

  const session = await getFullSession(id);
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const md = conversationToMarkdown(session);
  const date = session.updatedAt.toISOString().slice(0, 10);
  const filename = `${date}-${id.slice(-8)}.md`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
