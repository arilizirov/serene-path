/**
 * Export FINISHED intake conversations from the server DB to local Markdown files.
 *
 * Each finished conversation (no activity for THERAPER_IDLE_MIN minutes) becomes one
 * .md file in THERAPER_OUT (default ~/theraper-conversations) — your local archive.
 * Incremental: a manifest.json there tracks what's already exported, so re-runs only
 * pull new ones. Read-only on the server (it does not delete anything).
 *
 * Runs the query on the server via `ssh … sudo -u postgres psql` (the SQL is piped in
 * over stdin, so there's no shell-quoting), then renders Markdown locally.
 *
 * Usage:  npm run export:convos        (or: npx tsx scripts/export-conversations.ts)
 * Env:    THERAPER_SERVER (aidev@82.165.223.174), THERAPER_SSH_KEY (~/.ssh/therapli_deploy),
 *         THERAPER_OUT (~/theraper-conversations), THERAPER_IDLE_MIN (30), THERAPER_DB (therapli)
 *
 * NOTE (§11): these transcripts are sensitive mental-health data. The output folder
 * lives OUTSIDE the repo (never committed); keep it secure on your machine.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SERVER = process.env.THERAPER_SERVER ?? "aidev@82.165.223.174";
const KEY = process.env.THERAPER_SSH_KEY ?? join(homedir(), ".ssh", "therapli_deploy");
const OUT = process.env.THERAPER_OUT ?? join(homedir(), "theraper-conversations");
const IDLE_MIN = process.env.THERAPER_IDLE_MIN ?? "30";
const DB = process.env.THERAPER_DB ?? "therapli";

type Message = { role: string; content: string };
type Row = {
  id: string;
  state: string;
  messages: Message[] | null;
  constraints: { phase?: string; engine?: string } | null;
  matched: string[] | null;
  createdAt: string;
  updatedAt: string;
};

const SQL = `SELECT coalesce(json_agg(row_to_json(s) ORDER BY s."createdAt"), '[]') FROM (
  SELECT id, state, messages, constraints, "suggestedTherapistIds" AS matched, "createdAt", "updatedAt"
  FROM "IntakeSession"
  WHERE "updatedAt" < now() - interval '${Number(IDLE_MIN)} minutes'
    AND jsonb_array_length(messages::jsonb) > 0
) s`;

function fetchRows(): Row[] {
  const remote = `cd /tmp && sudo -u postgres psql -d ${DB} -tA -f -`;
  const out = execFileSync(
    "ssh",
    ["-i", KEY, "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", SERVER, remote],
    { input: SQL, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
  );
  return JSON.parse(out.trim() || "[]") as Row[];
}

function renderMarkdown(r: Row): string {
  const c = r.constraints ?? {};
  const msgs = r.messages ?? [];
  const head = [
    "---",
    `id: ${r.id}`,
    `created: ${r.createdAt}`,
    `finished: ${r.updatedAt}`,
    `state: ${r.state}`,
    `engine: ${c.engine ?? ""}`,
    `matched_therapists: ${(r.matched ?? []).join(", ")}`,
    `turns: ${msgs.length}`,
    "---",
    "",
    "# Intake conversation",
    "",
  ].join("\n");
  const body = msgs
    .map((m) => `**${m.role === "user" ? "User" : "Assistant"}:**\n\n${m.content}`)
    .join("\n\n");
  return `${head}${body}\n`;
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  // The output folder may sit inside another git repo (e.g. the home dir). Drop a
  // gitignore so these sensitive transcripts can never be accidentally committed.
  const gi = join(OUT, ".gitignore");
  if (!existsSync(gi)) writeFileSync(gi, "*\n", "utf8");
  const manifestPath = join(OUT, "manifest.json");
  const manifest: { exportedIds: string[]; lastRun: string | null } = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : { exportedIds: [], lastRun: null };
  const seen = new Set(manifest.exportedIds);

  const rows = fetchRows();
  let added = 0;
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    const date = (r.createdAt ?? "").slice(0, 10) || "undated";
    writeFileSync(join(OUT, `${date}-${r.id.slice(-8)}.md`), renderMarkdown(r), "utf8");
    seen.add(r.id);
    added += 1;
  }

  manifest.exportedIds = [...seen];
  manifest.lastRun = new Date().toISOString();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(
    `Exported ${added} new conversation(s) → ${OUT}\n` +
      `(${rows.length} finished on server, ${seen.size} archived locally in total).`,
  );
}

main();
