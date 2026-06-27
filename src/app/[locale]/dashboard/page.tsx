import { getTranslations } from "next-intl/server";
import { DateTime } from "luxon";
import { requireRole } from "@/features/accounts";
import { getMyProfileForEdit } from "@/features/therapists";
import { getTherapistAppointments } from "@/features/scheduling";
import { getThreads, getThread } from "@/features/messaging";
import { CockpitShell, type CockpitNavItem } from "@/components/cockpit-shell";
import { CockpitHero } from "@/components/cockpit/cockpit-hero";
import { CockpitSchedule, type ScheduleDay, type SessionTone } from "@/components/cockpit/cockpit-schedule";
import { CockpitGreeting, type QuickAction } from "@/components/cockpit/cockpit-greeting";
import { CockpitMessages, type Conversation, type ThreadMessage } from "@/components/cockpit/cockpit-messages";

// The therapist cockpit — the warm "fitplan" home, wired to live data. Times are
// shown in Israel time (matching the rest of the app). The `.theme-warm` wrapper
// scopes the coral/cream palette to this surface only. Read-only messages for now
// (real conversation list + latest thread); the live composer + accept/reject land
// in the follow-up. Never cached.
const TZ = "Asia/Jerusalem";
export const dynamic = "force-dynamic";

const toneOf = (status: string): SessionTone =>
  status === "CONFIRMED" ? "accent" : status === "PENDING" ? "accent2" : "muted";

export default async function CockpitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { id: userId } = await requireRole("THERAPIST", locale);
  const t = await getTranslations("Cockpit");

  const [profile, upcoming, threads] = await Promise.all([
    getMyProfileForEdit(userId),
    getTherapistAppointments(userId),
    getThreads(userId),
  ]);

  const name = (profile?.name ?? "").trim();
  const firstName = name.split(/\s+/)[0] || name;

  const at = (iso: string) => DateTime.fromISO(iso, { zone: "utc" }).setZone(TZ).setLocale(locale);
  const next = upcoming.find((a) => a.status === "CONFIRMED") ?? upcoming[0] ?? null;

  // Weekly schedule — the current Sun→Thu, appointments placed in their day.
  const today = DateTime.now().setZone(TZ).startOf("day");
  const weekStart = today.minus({ days: today.weekday % 7 }); // luxon: Mon=1..Sun=7 → Sunday start
  const days: ScheduleDay[] = Array.from({ length: 5 }, (_, i) => {
    const day = weekStart.plus({ days: i });
    return {
      key: day.toISODate() ?? String(i),
      weekday: day.setLocale(locale).toFormat("ccc"),
      dayNum: day.toFormat("d"),
      today: day.hasSame(today, "day"),
      events: upcoming
        .filter((a) => at(a.startIso).hasSame(day, "day"))
        .map((a) => ({
          id: a.id,
          title: a.clientName || "—",
          timeLabel: at(a.startIso).toFormat("HH:mm"),
          tone: toneOf(a.status),
        })),
    };
  });
  const weekLabel = `${weekStart.setLocale(locale).toFormat("d LLL")} – ${weekStart.plus({ days: 4 }).setLocale(locale).toFormat("d LLL")}`;

  // Conversations + the latest thread (read-only preview — markRead=false).
  const conversations: Conversation[] = threads.map((th) => ({
    id: th.otherId,
    name: th.name,
    lastMessage: th.lastMessage,
    timeLabel: DateTime.fromISO(th.lastAtIso).setZone(TZ).setLocale(locale).toFormat("HH:mm"),
    unread: th.unread,
  }));
  let activeName = "";
  let messages: ThreadMessage[] = [];
  if (conversations[0]) {
    const thread = await getThread(userId, conversations[0].id, undefined, false);
    if (thread.ok) {
      activeName = conversations[0].name;
      messages = thread.messages.map((m) => ({
        id: m.id,
        fromMe: m.fromMe,
        body: m.body,
        timeLabel: DateTime.fromISO(m.createdAtIso).setZone(TZ).setLocale(locale).toFormat("HH:mm"),
      }));
    }
  }

  const unreadTotal = threads.reduce((s, th) => s + th.unread, 0);
  const nav: CockpitNavItem[] = [
    { key: "home", label: t("nav.home"), href: "/dashboard", icon: "home" },
    { key: "calendar", label: t("nav.calendar"), href: "/dashboard/calendar", icon: "calendar" },
    { key: "clients", label: t("nav.clients"), href: "/dashboard/clients", icon: "clients" },
    { key: "messages", label: t("nav.messages"), href: "/dashboard/messages", icon: "messages", badge: unreadTotal || undefined },
    { key: "settings", label: t("nav.settings"), href: "/dashboard/settings", icon: "settings" },
  ];
  const actions: QuickAction[] = [
    { key: "slot", label: t("qaAvailability"), href: "/dashboard/profile", icon: "slot" },
    { key: "msg", label: t("qaMessage"), href: "/dashboard/messages", icon: "message" },
    { key: "profile", label: t("qaProfile"), href: "/dashboard/profile", icon: "profile" },
  ];

  return (
    <div className="theme-warm">
      <CockpitShell
        nav={nav}
        activeKey="home"
        user={{ name }}
        searchPlaceholder={t("search")}
        notifications={unreadTotal}
      >
        <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="flex flex-col gap-5">
            <CockpitHero
              eyebrow={t("nextSession")}
              joinLabel={t("join")}
              emptyTitle={t("noSessionsTitle")}
              emptyBody={t("noSessionsBody")}
              session={
                next
                  ? {
                      clientName: next.clientName || "—",
                      dateLabel: at(next.startIso).toFormat("ccc, d LLL"),
                      timeLabel: at(next.startIso).toFormat("HH:mm"),
                      joinHref: `/appointments/${next.id}/session`,
                    }
                  : undefined
              }
            />
            <CockpitSchedule title={t("scheduleTitle")} weekLabel={weekLabel} emptyLabel="" days={days} />
          </div>

          <div className="flex flex-col gap-5">
            <CockpitGreeting
              heading={t("greeting", { name: firstName })}
              subtitle={t("subtitle")}
              actions={actions}
            />
            <CockpitMessages
              title={t("chats")}
              conversations={conversations}
              activeName={activeName}
              messages={messages}
              composerPlaceholder={t("composer")}
              acceptLabel={t("accept")}
              rejectLabel={t("reject")}
              emptyLabel={t("noChats")}
              readOnly
            />
          </div>
        </div>
      </CockpitShell>
    </div>
  );
}
