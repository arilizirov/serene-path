import { z } from "zod";

// Single source of truth for password STRENGTH. bcrypt silently truncates beyond
// 72 BYTES (multi-byte he/fr chars count per byte), so cap byte-length HERE — the
// boundary where the password is set — so two long passwords can't collide on a
// shared prefix. TextEncoder is used (not Buffer) so the schema stays
// runtime-portable. Reused by registration AND admin-initiated password creation
// (createAdmin, resetUserPassword) so every new password meets the same rules.
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine(
    (p) => new TextEncoder().encode(p).length <= 72,
    "Password is too long",
  );

// Registration input.
export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// The Role enum literals (kept in sync with prisma/schema.prisma). Constrains
// `role` at the action boundary so an arbitrary string can never reach
// updateUserRole / the DB. This schema-leaf is the single source of the Role
// TYPE too (below): defining it here — not in service — lets repository.ts import
// the type without a service↔repository import cycle. Re-declared rather than
// imported from the generated Prisma client to keep the feature ORM-decoupled,
// matching the convention used elsewhere in this feature.
export const roleSchema = z.enum(["CLIENT", "THERAPIST", "ADMIN"]);

/** The role a user holds. Derived from roleSchema so the type and the runtime
 *  validator can never drift. */
export type Role = z.infer<typeof roleSchema>;

// Admin "create admin" input — same email/name/password shape as registration,
// reusing the shared password-strength rule.
export const createAdminSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  password: passwordSchema,
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
