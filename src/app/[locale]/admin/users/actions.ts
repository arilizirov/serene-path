"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  requireRole,
  createAdmin,
  setUserRole,
  resetUserPassword,
  createAdminSchema,
  roleSchema,
  passwordSchema,
} from "@/features/accounts";

// Admin user & role management actions (Phase 3). Server Actions compile to
// independent POST endpoints dispatched before/independent of page + layout
// rendering, so the admin layout's requireRole does NOT protect them — each
// action MUST re-check requireRole("ADMIN") as its FIRST statement and touch no
// data before that gate passes. After the gate, every untrusted input is
// zod-validated at the boundary: `role` is constrained to the Role enum (never an
// arbitrary string written to the DB) and new passwords meet the same strength
// rule as registration (passwordSchema). These are privilege-sensitive (creating
// admins, changing roles, resetting passwords), so the gate is the load-bearing
// control — fail closed.

export type UsersActionState = { error?: string };

/** Create a new ADMIN account (email + name + password). */
export async function createAdminAction(
  _prev: UsersActionState,
  formData: FormData,
): Promise<UsersActionState> {
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  const parsed = createAdminSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const result = await createAdmin(parsed.data);
  if (!result.ok) return { error: result.error };

  redirect(`/${locale}/admin/users`);
}

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

/** Change a user's role. The last-admin lockout guard lives in the service
 *  (setUserRole) — surfaced here as a returned error rather than a thrown 500. */
export async function setUserRoleAction(
  _prev: UsersActionState,
  formData: FormData,
): Promise<UsersActionState> {
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  const parsed = setRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Select a valid role." };

  const result = await setUserRole(parsed.data.userId, parsed.data.role);
  if (!result.ok) return { error: result.error };

  redirect(`/${locale}/admin/users`);
}

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  password: passwordSchema,
});

/** Reset a user's password. Strength is enforced via passwordSchema (the same
 *  rule registration uses); the plaintext is never logged or returned. */
export async function resetPasswordAction(
  _prev: UsersActionState,
  formData: FormData,
): Promise<UsersActionState> {
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid password." };
  }

  await resetUserPassword(parsed.data.userId, parsed.data.password);

  redirect(`/${locale}/admin/users`);
}
