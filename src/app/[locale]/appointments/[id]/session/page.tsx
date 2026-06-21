import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DateTime } from "luxon";
import { getCurrentUser } from "@/features/accounts";
import { joinSession } from "@/features/sessions";
import { isLocale } from "@/lib/utils";

const DISPLAY_TZ = "Asia/Jerusalem";

// Live access decision (ownership + time window) — never cache.
export const dynamic = "force-dynamic";

const DENIAL: Record<string, string> = {
  not_found: "This session isn't available.",
  too_early: "The room opens 10 minutes before your appointment. Please come back closer to the start time.",
  ended: "This session has ended.",
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";

  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${locale}/appointments/${id}/session`);
    redirect(`/${locale}/login?next=${next}`);
  }

  const result = await joinSession(id, user.id);

  const back = (
    <Link href={`/${locale}/appointments`} className="text-sm text-primary">
      ← Your appointments
    </Link>
  );

  if (!result.ok) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Session
        </h1>
        <p className="rounded-md bg-surface-container px-4 py-3 text-on-surface-variant">
          {DENIAL[result.reason]}
        </p>
        {back}
      </main>
    );
  }

  const fmt = (i: string) =>
    DateTime.fromISO(i, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Session{" "}
        <span className="text-sm font-normal text-on-surface-variant">
          (Israel time)
        </span>
      </h1>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container p-6">
        <p className="text-on-surface">
          You&apos;re cleared to join — {fmt(result.startIso)} to{" "}
          {fmt(result.endIso)}.
        </p>
        {/* The live video embed (camera/mic pre-check, mute, leave) is wired
            here once a VideoProvider is chosen (§12). The room + your join
            credential are already issued by the adapter. */}
        <div className="flex aspect-video items-center justify-center rounded-xl bg-surface-container-highest text-center text-on-surface-variant">
          <span className="px-6 text-sm">
            Video is being set up for your platform. Your room is reserved — the
            live call opens here once the video provider is connected.
          </span>
        </div>
      </section>

      {back}
    </main>
  );
}
