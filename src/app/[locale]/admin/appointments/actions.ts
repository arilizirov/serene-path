"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/accounts";
import { adminSetStatus } from "@/features/scheduling";

// Admin-scoped appointment writes (Phase 2). These are NOT the owner-scoped
// cancelAppointment — an ADMIN acts over ANY appointment, so the ONLY trust
// boundary is the requireRole("ADMIN") re-check here. Server Actions compile to
// independent POST endpoints dispatched before/independent of the admin layout's
// requireRole, so each action must fail closed on its own (same rationale as the
// therapists feature's admin actions). The appointment id is a plain row id; no
// owner scoping is intended, so a forged id only ever flips a real row the admin
// is entitled to manage. Composed at the app layer because the scheduling feature
// may not import accounts (boundaries.yaml: scheduling -> [therapists] only).

/** Admin cancels any appointment (sets status CANCELLED). */
export async function adminCancelAppointment(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await requireRole("ADMIN", locale);
  if (appointmentId) {
    await adminSetStatus(appointmentId, "CANCELLED");
  }
  redirect(`/${locale}/admin/appointments`);
}

/** Admin marks any appointment as a no-show (sets status NO_SHOW). */
export async function adminMarkNoShow(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await requireRole("ADMIN", locale);
  if (appointmentId) {
    await adminSetStatus(appointmentId, "NO_SHOW");
  }
  redirect(`/${locale}/admin/appointments`);
}
