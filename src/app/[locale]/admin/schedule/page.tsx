import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllTherapistsSchedules } from "@/features/scheduling";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";

// Always reflect current DB state (rules / blocked dates / live slots change
// continuously); also avoids coupling `next build` to a live database.
export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Render one therapist's weekly rules as "Mon 09:00–12:00" lines. */
function formatRules(
  rules: { weekday: number; start: string; end: string }[],
): string[] {
  return rules.map(
    (r) => `${WEEKDAYS[r.weekday] ?? "?"} ${r.start}–${r.end}`,
  );
}

/** A bookable slot ISO instant as a short, locale-agnostic "MM-DD HH:mm" UTC. */
function formatSlot(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(5, 16).replace("T", " ")}`;
}

// Read-mostly overview of EVERY therapist's schedule in one place (Phase 2).
// Editing is reused via the existing per-therapist editor (/admin/therapists/[id]),
// where the admin-scoped saveAvailabilityAction (requireRole ADMIN, keyed by
// therapistId) already lets an admin change any therapist's availability.
export default async function AdminSchedulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const schedules = await getAllTherapistsSchedules();
  return (
    <DashboardShell
      nav={adminNav}
      activeKey="schedule"
      title={t("title.schedule")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      {schedules.length === 0 ? (
        <p className="text-on-surface-variant">No therapists yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {schedules.map((s) => {
            const rules = formatRules(s.rules);
            return (
              <section
                key={s.therapistId}
                className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-on-surface">
                      {s.name || "—"}
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      {s.title} · {s.status}
                    </p>
                  </div>
                  <Link
                    href={`/admin/therapists/${s.therapistId}`}
                    className="shrink-0 text-sm text-primary underline"
                  >
                    Edit schedule
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <h3 className="text-xs font-medium uppercase text-on-surface-variant">
                      Weekly availability
                    </h3>
                    {rules.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">None set</p>
                    ) : (
                      <ul className="text-sm text-on-surface">
                        {rules.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium uppercase text-on-surface-variant">
                      Blocked dates
                    </h3>
                    {s.blockedDates.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">None</p>
                    ) : (
                      <ul className="text-sm text-on-surface">
                        {s.blockedDates.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium uppercase text-on-surface-variant">
                      Next slots (UTC)
                    </h3>
                    {s.upcomingSlots.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">None</p>
                    ) : (
                      <ul className="text-sm text-on-surface">
                        {s.upcomingSlots.map((iso) => (
                          <li key={iso}>{formatSlot(iso)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
