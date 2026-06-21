import { prisma } from "@/lib/db";

/** A user's auth fields by email, for credential sign-in. */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });
}
