"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login, logout, registerClient, type Role } from "./service";
import { registerSchema } from "./schema";

/** Where each role lands after signing in. */
function roleHome(role: Role, locale: string): string {
  // ADMIN → /admin/therapists for now (the /admin dashboard index lands in Phase 1).
  if (role === "ADMIN") return `/${locale}/admin/therapists`;
  if (role === "THERAPIST") return `/${locale}/dashboard`;
  return `/${locale}/appointments`; // CLIENT
}

/** Guard the role-restricted areas so honoring a ?next= can't bounce someone into
 *  a page their role can't reach (which would loop back to login). */
function roleMayAccess(role: Role, path: string): boolean {
  if (/^\/[^/]+\/admin(\/|$)/.test(path)) return role === "ADMIN";
  if (/^\/[^/]+\/dashboard(\/|$)/.test(path)) return role === "THERAPIST";
  return true;
}

const loginSchema = z.object({
  email: z.email(),
  // Cap length to bound bcrypt work (DoS) on login. Registration enforces the
  // real strength rules + the 72-byte bcrypt cap.
  password: z.string().min(1).max(128),
});

export type LoginState = { error?: string };

/** Only allow a same-origin absolute path as the post-login redirect target —
 *  reject protocol-relative ("//evil"), backslash variants ("/\evil", which
 *  browsers normalize to "//evil"), and external URLs (open-redirect guard). */
function safeNext(next: string, fallback: string): string {
  return /^\/(?![/\\])/.test(next) ? next : fallback;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = String(formData.get("locale") ?? "en");
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const principal = await login(parsed.data.email, parsed.data.password);
  if (!principal) return { error: "Invalid email or password." };

  // Route by role: a CLIENT must not be sent to the ADMIN area (the old hardcoded
  // /admin/therapists fallback bounced every non-admin into a redirect loop).
  const home = roleHome(principal.role, locale);
  const dest = safeNext(String(formData.get("next") ?? ""), home);
  redirect(roleMayAccess(principal.role, dest) ? dest : home);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  await logout();
  redirect(`/${locale}`);
}

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const locale = String(formData.get("locale") ?? "en");
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }
  const result = await registerClient(parsed.data);
  if (!result.ok) return { error: result.error };
  redirect(`/${locale}`);
}
