"use server";

import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getCurrentUser, getUserContact } from "@/features/accounts";
import { getTherapistProfile } from "@/features/therapists";
import { createBooking } from "@/features/scheduling";
import { sendBookingConfirmation } from "@/server/email";
import { isLocale } from "@/lib/utils";

// Mirrors the profile page's slot display (Israel time) so the email's time
// matches what the client just clicked.
const DISPLAY_TZ = "Asia/Jerusalem";

/**
 * Send the booking confirmation. Best-effort: a mail failure must NEVER fail a
 * booking that already succeeded (the client also sees on-page confirmation).
 */
async function confirmByEmail(
  userId: string,
  therapistId: string,
  startUtc: string,
  locale: string,
): Promise<void> {
  try {
    const loc = isLocale(locale) ? locale : "en";
    const [contact, t] = await Promise.all([
      getUserContact(userId),
      getTherapistProfile(therapistId, loc),
    ]);
    if (!contact?.email || !t) return;
    const whenLabel = DateTime.fromISO(startUtc, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(loc)
      .toFormat("ccc d LLL HH:mm");
    await sendBookingConfirmation({
      to: contact.email,
      therapistName: t.name,
      whenLabel,
      locale: loc,
    });
  } catch {
    // swallow — confirmation is non-critical to the booking
  }
}

/**
 * Book a slot. Auth-gated: an anonymous visitor is sent to login and returned
 * to this profile (?next). The client id comes from the SESSION, never the form.
 * Result is surfaced back via a query flag.
 */
export async function bookSlotAction(formData: FormData): Promise<void> {
  // Narrow the locale once, here, so every downstream path (redirects, ?next,
  // the email) shares one sanitized value.
  const rawLocale = String(formData.get("locale") ?? "en");
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const therapistId = String(formData.get("therapistId") ?? "");
  const startUtc = String(formData.get("startUtc") ?? "");

  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${locale}/therapists/${therapistId}`);
    redirect(`/${locale}/login?next=${next}`);
  }

  const result = await createBooking(therapistId, user.id, startUtc);
  if (result.ok) {
    await confirmByEmail(user.id, therapistId, startUtc, locale);
  }
  const flag = result.ok
    ? "booked=1"
    : `error=${encodeURIComponent(result.error)}`;
  redirect(`/${locale}/therapists/${therapistId}?${flag}`);
}
