import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DateTime } from "luxon";
import { getCurrentUser } from "@/features/accounts";
import { getMyAppointments } from "@/features/scheduling";
import { isLocale } from "@/lib/utils";
import { cancelAppointmentAction } from "./actions";

// Times shown in Israel time for now (matches the booking page); per-viewer tz
// rendering is a later refinement.
const DISPLAY_TZ = "Asia/Jerusalem";

// Personal, live list — never cache.
export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
}) {
  const { cancelled, error } = await searchParams;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";

  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${locale}/appointments`);
    redirect(`/${locale}/login?next=${next}`);
  }

  const appointments = (await getMyAppointments(user.id)).map((a) => ({
    ...a,
    label: DateTime.fromISO(a.startIso, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm"),
  }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Your appointments{" "}
        <span className="text-sm font-normal text-on-surface-variant">
          (Israel time)
        </span>
      </h1>

      {cancelled ? (
        <p className="rounded-md bg-tertiary-container px-3 py-2 text-sm text-on-tertiary-container">
          Appointment cancelled.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">
          That appointment couldn&apos;t be cancelled.
        </p>
      ) : null}

      {appointments.length === 0 ? (
        <p className="text-on-surface-variant">
          You have no upcoming appointments.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {appointments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container p-4"
            >
              <div className="flex flex-col">
                <span className="text-on-surface">
                  {a.therapistName || a.therapistTitle}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {a.therapistTitle} · {a.label}
                </span>
                <span className="text-xs text-on-surface-variant">{a.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/appointments/${a.id}/session`}
                  className="rounded-full bg-primary px-3 py-1.5 text-sm text-on-primary transition hover:opacity-90"
                >
                  Join
                </Link>
                <form action={cancelAppointmentAction}>
                  <input type="hidden" name="locale" defaultValue={locale} />
                  <input
                    type="hidden"
                    name="appointmentId"
                    defaultValue={a.id}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-outline px-3 py-1.5 text-sm text-on-surface transition hover:bg-error hover:text-on-error"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
