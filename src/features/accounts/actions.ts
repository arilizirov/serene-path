"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login, logout, registerClient } from "./service";
import { registerSchema } from "./schema";

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

  const ok = await login(parsed.data.email, parsed.data.password);
  if (!ok) return { error: "Invalid email or password." };

  redirect(
    safeNext(String(formData.get("next") ?? ""), `/${locale}/admin/therapists`),
  );
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
