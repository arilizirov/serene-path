import { z } from "zod";

// Registration input. bcrypt silently truncates beyond 72 BYTES (multi-byte
// he/fr chars count per byte), so cap byte-length HERE — the boundary where the
// password is set — so two long passwords can't collide on a shared prefix.
// TextEncoder is used (not Buffer) so the schema stays runtime-portable.
export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .refine(
      (p) => new TextEncoder().encode(p).length <= 72,
      "Password is too long",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
