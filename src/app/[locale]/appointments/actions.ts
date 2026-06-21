"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/accounts";
import { cancelAppointment } from "@/features/scheduling";

/**
 * Cancel one of the caller's own appointments. The user id comes from the
 * SESSION (never the form); cancelAppointment scopes the UPDATE to that owner, so
 * a forged appointment id from another user simply changes nothing. Auth-gated.
 */
export async function cancelAppointmentAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const appointmentId = String(formData.get("appointmentId") ?? "");

  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${locale}/appointments`);
    redirect(`/${locale}/login?next=${next}`);
  }

  const cancelled = await cancelAppointment(appointmentId, user.id);
  redirect(
    `/${locale}/appointments?${cancelled ? "cancelled=1" : "error=1"}`,
  );
}
