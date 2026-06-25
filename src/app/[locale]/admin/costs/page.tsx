import { getCostStats, recentCalls } from "@/server/ai";
import { AdminNav } from "../admin-nav";

// Phase 4 — API cost & usage tracking dashboard. Reflects current DB state and
// avoids coupling `next build` to a live DB.
export const dynamic = "force-dynamic";

/** Format an estimated USD amount (4 dp so sub-cent calls stay visible). */
function usd(n: number): string {
  return `$${n.toFixed(4)}`;
}

/** Compact thousands separators for token counts. */
function tokens(n: number): string {
  return n.toLocaleString("en-US");
}

/** A labelled stat card: tokens headline + estimated $ + call count subline. */
function CostCard({
  label,
  totalTokens,
  estCostUsd,
  calls,
}: {
  label: string;
  totalTokens: number;
  estCostUsd: number;
  calls: number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
      <span className="text-3xl font-bold text-on-surface">{tokens(totalTokens)}</span>
      <span className="text-sm font-medium text-primary">{label} · tokens</span>
      <span className="text-sm text-on-surface-variant">
        ~{usd(estCostUsd)} · {calls} {calls === 1 ? "call" : "calls"}
      </span>
    </div>
  );
}

// Costs are DERIVED from the ApiUsage table (groupBy/aggregate, no full-table
// load). The dollar figures are ESTIMATES from a configurable per-model price map
// (server/ai/usage.ts) — flagged on the page so no one reads them as billed.
export default async function AdminCostsPage() {
  const [stats, recent] = await Promise.all([getCostStats(), recentCalls(20)]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <AdminNav />
      <h1 className="font-heading text-2xl font-bold text-on-background">
        API cost &amp; usage
      </h1>
      <p className="text-sm text-on-surface-variant">
        Dollar amounts are <strong>estimates</strong> from a configurable
        per-model price map, not billed amounts — verify against the live OpenAI
        rate card before relying on them.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <CostCard label="Today" {...stats.today} />
        <CostCard label="Last 7 days" {...stats.last7Days} />
        <CostCard label="All time" {...stats.allTime} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold text-on-surface">
          By call type (all-time)
        </h2>
        {stats.byCallType.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No usage recorded yet.</p>
        ) : (
          <table className="w-full max-w-xl border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant">
                <th className="py-1.5 text-start font-medium">Call type</th>
                <th className="py-1.5 text-end font-medium">Calls</th>
                <th className="py-1.5 text-end font-medium">Tokens</th>
                <th className="py-1.5 text-end font-medium">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {stats.byCallType.map((r) => (
                <tr
                  key={r.callType}
                  className="border-b border-outline-variant/40 text-on-surface"
                >
                  <td className="py-1.5">{r.callType}</td>
                  <td className="py-1.5 text-end">{r.calls}</td>
                  <td className="py-1.5 text-end">{tokens(r.totalTokens)}</td>
                  <td className="py-1.5 text-end font-medium">~{usd(r.estCostUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold text-on-surface">
          Recent calls
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No calls recorded yet.</p>
        ) : (
          <table className="w-full border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant">
                <th className="py-1.5 text-start font-medium">When</th>
                <th className="py-1.5 text-start font-medium">Model</th>
                <th className="py-1.5 text-start font-medium">Call type</th>
                <th className="py-1.5 text-end font-medium">Tokens</th>
                <th className="py-1.5 text-end font-medium">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-outline-variant/40 text-on-surface"
                >
                  <td className="py-1.5">{c.createdAt.toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td className="py-1.5">{c.model}</td>
                  <td className="py-1.5">{c.callType}</td>
                  <td className="py-1.5 text-end">{tokens(c.totalTokens)}</td>
                  <td className="py-1.5 text-end font-medium">~{usd(c.estCostUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
