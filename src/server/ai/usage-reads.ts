import { prisma } from "@/lib/db";

// Phase 4 — admin READS for the cost/usage dashboard. All queries use prisma
// aggregate / groupBy (no full-table loads): totals over time windows, a
// breakdown by callType, and the N most recent calls. Costs are ESTIMATES (see
// usage.ts PRICING) and are surfaced as such on the admin page.

/** Totals for one time window: token count + estimated USD across all calls. */
export type CostWindow = { totalTokens: number; estCostUsd: number; calls: number };

/** One row of the by-callType breakdown. */
type CallTypeRow = { callType: string; totalTokens: number; estCostUsd: number; calls: number };

/** One recent call, for the recent-calls table. */
export type RecentCall = {
  id: string;
  model: string;
  callType: string;
  totalTokens: number;
  estCostUsd: number;
  createdAt: Date;
};

/** Everything the costs dashboard's cards + by-callType table need. */
export type CostStats = {
  today: CostWindow;
  last7Days: CostWindow;
  allTime: CostWindow;
  byCallType: CallTypeRow[];
};

/** Start of "today" (server local midnight) — the window boundary for the today card. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** N days ago from now — the window boundary for the rolling 7-day card. */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Aggregate token + cost totals over calls created on/after `since` (or all-time). */
async function windowTotals(since?: Date): Promise<CostWindow> {
  const agg = await prisma.apiUsage.aggregate({
    where: since ? { createdAt: { gte: since } } : undefined,
    _sum: { totalTokens: true, estCostUsd: true },
    _count: { _all: true },
  });
  return {
    totalTokens: agg._sum.totalTokens ?? 0,
    estCostUsd: agg._sum.estCostUsd ?? 0,
    calls: agg._count._all,
  };
}

/** Token + cost totals grouped by callType (all-time), highest token use first. */
async function totalsByCallType(): Promise<CallTypeRow[]> {
  const rows = await prisma.apiUsage.groupBy({
    by: ["callType"],
    _sum: { totalTokens: true, estCostUsd: true },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({
      callType: r.callType,
      totalTokens: r._sum.totalTokens ?? 0,
      estCostUsd: r._sum.estCostUsd ?? 0,
      calls: r._count._all,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

/**
 * The dashboard's headline figures: token + estimated-$ totals for today, the
 * last 7 days, and all-time, plus the by-callType breakdown. Costs are estimates.
 */
export async function getCostStats(): Promise<CostStats> {
  const [today, last7Days, allTime, byCallType] = await Promise.all([
    windowTotals(startOfToday()),
    windowTotals(daysAgo(7)),
    windowTotals(),
    totalsByCallType(),
  ]);
  return { today, last7Days, allTime, byCallType };
}

/** The `limit` most recent calls (newest first) for the recent-calls table. */
export async function recentCalls(limit = 20): Promise<RecentCall[]> {
  const rows = await prisma.apiUsage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      model: true,
      callType: true,
      totalTokens: true,
      estCostUsd: true,
      createdAt: true,
    },
  });
  return rows;
}
