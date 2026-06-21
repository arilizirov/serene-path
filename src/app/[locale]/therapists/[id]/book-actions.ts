"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/accounts";
import { createBooking } from "@/features/scheduling";

/**
 * Book a slot. Auth-gated: an anonymous visitor is sent to login and returned
 * to this profile (?next). The client id comes from the SESSION, never the form.
 * Result is surfaced back via a query flag.
 */
export async function bookSlotAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const therapistId = String(formData.get("therapistId") ?? "");
  const startUtc = String(formData.get("startUtc") ?? "");

  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${locale}/therapists/${therapistId}`);
    redirect(`/${locale}/login?next=${next}`);
  }

  const result = await createBooking(therapistId, user.id, startUtc);
  const flag = result.ok
    ? "booked=1"
    : `error=${encodeURIComponent(result.error)}`;
  redirect(`/${locale}/therapists/${therapistId}?${flag}`);
}
