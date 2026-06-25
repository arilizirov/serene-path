import { getIntakeStats } from "@/features/intake";
import { getSignupStats } from "@/features/accounts";
import { getTherapistPipeline } from "@/features/therapists";
import { getAppointmentStatusCounts } from "@/features/scheduling";
import { AdminNav } from "../admin-nav";

// Always reflect current DB state; also avoids coupling `next build` to a live DB.
export const dynamic = "force-dynamic";

/** A labelled stat card (one headline number). */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
      <span className="text-3xl font-bold text-on-surface">{value}</span>
      <span className="text-sm font-medium text-primary">{label}</span>
    </div>
  );
}

/** A small breakdown table from a {key: count} record. */
function Breakdown({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts);
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-lg font-semibold text-on-surface">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No data yet.</p>
      ) : (
        <table className="w-full max-w-sm border-collapse text-start text-sm">
          <tbody>
            {entries.map(([k, v]) => (
              <tr
                key={k}
                className="border-b border-outline-variant/40 text-on-surface"
              >
                <td className="py-1.5">{k}</td>
                <td className="py-1.5 text-end font-medium">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// Website / intake statistics, DERIVED purely from the DB (no third-party
// trackers, no new tables). All reads use prisma groupBy/count where possible;
// the cross-feature composition happens here at the app layer (each feature
// exposes its own DB-derived read through its public index).
export default async function AdminStatsPage() {
  const [intake, signups, pipeline, bookings] = await Promise.all([
    getIntakeStats(),
    getSignupStats(),
    getTherapistPipeline(),
    getAppointmentStatusCounts(),
  ]);

  const matchPct = `${Math.round(intake.matchRate * 100)}%`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <AdminNav />
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Website / intake statistics
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Intake sessions" value={intake.total} />
        <StatCard label="Matched sessions" value={intake.matched} />
        <StatCard label="Match rate" value={matchPct} />
        <StatCard
          label={`New signups (${signups.recentDays}d)`}
          value={signups.recent}
        />
      </div>

      <Breakdown title="Intake funnel (by state)" counts={intake.byState} />
      <Breakdown
        title="Intake engine"
        counts={{
          ai: intake.engines.ai,
          scripted: intake.engines.scripted,
          none: intake.engines.none,
        }}
      />
      <Breakdown title="Signups (by role)" counts={signups.byRole} />
      <Breakdown title="Therapist pipeline (by status)" counts={pipeline} />
      <Breakdown title="Bookings (by status)" counts={bookings} />
    </main>
  );
}
