"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/accounts";
import { createBooking } from "@/features/scheduling";
import { isLocale } from "@/lib/utils";

// Composition-root server actions for the pending-booking handoff. A patient who
// picked a slot while signed out had it stashed in the `sp_pending_booking` cookie
// (see book-actions.ts); after they create an account / sign in, /account offers a
// one-click confirm. Booking glue lives HERE (the app root may import scheduling),
// never in the accounts feature.

const PENDING = "sp_pending_booking";

/** Finish the slot the patient stashed before signing up. Books for the SESSION
 *  user only (never a form-supplied id), so a stale/forged cookie can't book on
 *  someone else's behalf. The cookie is cleared whatever the outcome. */
export async function confirmPendingBookingAction(
  formData: FormData,
): Promise<void> {
  const raw = String(formData.get("locale") ?? "en");
  const locale = isLocale(raw) ? raw : "en";

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const jar = await cookies();
  const pending = jar.get(PENDING)?.value ?? "";
  jar.delete(PENDING);

  const [therapistId, startUtc] = pending.split("|");
  if (!therapistId || !startUtc) redirect(`/${locale}/account`);

  const result = await createBooking(therapistId, user.id, startUtc);
  redirect(
    result.ok
      ? `/${locale}/account?booked=1`
      : `/${locale}/account?error=${encodeURIComponent(result.error)}`,
  );
}

/** Drop the pending booking without booking it ("not now"). */
export async function dismissPendingBookingAction(
  formData: FormData,
): Promise<void> {
  const raw = String(formData.get("locale") ?? "en");
  const locale = isLocale(raw) ? raw : "en";
  const jar = await cookies();
  jar.delete(PENDING);
  redirect(`/${locale}/account`);
}
