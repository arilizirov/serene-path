import { requireRole } from "@/features/accounts";
import { listFinishedSessionsFull, conversationsToMarkdown } from "@/features/intake";

// GET /[locale]/admin/conversations/download-all — every finished transcript in
// one downloadable `.md`. Sibling of the dynamic [id] segment; a static segment
// alongside [id] is fine in the App Router (static wins, no collision).
//
// Transcripts are sensitive (§11): re-check ADMIN here at the route boundary
// (route handlers aren't covered by the /admin layout guard) BEFORE reading any
// session data. requireRole redirects non-admins to login.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  await requireRole("ADMIN", locale);

  const sessions = await listFinishedSessionsFull();
  const md = conversationsToMarkdown(sessions);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `theraper-conversations-${date}.md`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
