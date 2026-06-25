import { requireRole } from "@/features/accounts";
import {
  getFullSessionsByIds,
  conversationsToMarkdown,
  parseSelectedIds,
} from "@/features/intake";

// GET /[locale]/admin/conversations/download?ids=a,b,c — the selected finished
// transcripts in one downloadable `.md`. Static segment sibling of the dynamic
// [id] and the static download-all; static wins in the App Router (no collision).
//
// Transcripts are sensitive (§11): re-check ADMIN here at the route boundary
// (route handlers aren't covered by the /admin layout guard) BEFORE reading any
// session data. `ids` is parsed/deduped and CAPPED before the query, so a request
// can never trigger an unbounded `id: { in: [...] }`. requireRole redirects
// non-admins to login.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  await requireRole("ADMIN", locale);

  const raw = new URL(request.url).searchParams.get("ids");
  const parsed = parseSelectedIds(raw);
  if (!parsed.ok) {
    return new Response(parsed.error, { status: 400 });
  }

  const sessions = await getFullSessionsByIds(parsed.ids);
  const md = conversationsToMarkdown(sessions);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `theraper-conversations-selected-${date}.md`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
