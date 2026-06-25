import { getTranslations } from "next-intl/server";
import {
  getAllAppointments,
  appointmentStatusSchema,
} from "@/features/scheduling";
import { listTherapistsForAdmin } from "@/features/therapists";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";
import { adminCancelAppointment, adminMarkNoShow } from "./actions";
import { AppointmentActionButton } from "./appointment-action-button";

// Always reflect current DB state; also avoids coupling `next build` to a live DB.
export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

/** "YYYY-MM-DD HH:mm" in UTC for a stored instant. */
function formatInstant(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

// Filterable admin table over EVERY appointment (Phase 2), newest-first. Filters
// are read from the query string and validated at the boundary before the read.
// Per-row admin actions (cancel / no-show) are admin-scoped (requireRole ADMIN in
// actions.ts), wired as confirm-on-submit buttons.
export default async function AdminAppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; therapistId?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const sp = await searchParams;

  // Validate untrusted query input at the boundary; ignore anything invalid.
  const statusParsed = appointmentStatusSchema.safeParse(sp.status);
  const status = statusParsed.success ? statusParsed.data : undefined;
  const therapistId = sp.therapistId || undefined;

  const [rows, therapists] = await Promise.all([
    getAllAppointments({ status, therapistId }),
    listTherapistsForAdmin(),
  ]);

  return (
    <DashboardShell
      nav={adminNav}
      activeKey="appointments"
      title={t("title.appointments")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      <div className="flex flex-col gap-6">
      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant">Status</span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant">Therapist</span>
          <select
            name="therapistId"
            defaultValue={therapistId ?? ""}
            className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface"
          >
            <option value="">All</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1.5 font-medium text-on-primary"
        >
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-on-surface-variant">No appointments match.</p>
      ) : (
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-on-surface-variant">
              <th className="py-2 text-start">When (UTC)</th>
              <th className="py-2 text-start">Therapist</th>
              <th className="py-2 text-start">Client</th>
              <th className="py-2 text-start">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-outline-variant/40 text-on-surface"
              >
                <td className="py-2">{formatInstant(r.startIso)}</td>
                <td className="py-2">
                  {r.therapistName}
                  <div className="text-xs text-on-surface-variant">
                    {r.therapistTitle}
                  </div>
                </td>
                <td className="py-2">
                  {r.clientName || "—"}
                  <div className="text-xs text-on-surface-variant">
                    {r.clientEmail}
                  </div>
                </td>
                <td className="py-2">{r.status}</td>
                <td className="py-2 text-end">
                  <div className="flex items-center justify-end gap-3">
                    <AppointmentActionButton
                      action={adminCancelAppointment}
                      appointmentId={r.id}
                      locale={locale}
                      label="Cancel"
                      confirmText="Cancel this appointment? This frees the slot for rebooking."
                      className="text-xs text-error underline"
                    />
                    <AppointmentActionButton
                      action={adminMarkNoShow}
                      appointmentId={r.id}
                      locale={locale}
                      label="No-show"
                      confirmText="Mark this appointment as a no-show?"
                      className="text-xs text-on-surface-variant underline"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </DashboardShell>
  );
}
