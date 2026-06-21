import { prisma } from "@/lib/db";

/** A user's auth fields by email, for credential sign-in. */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });
}

/** Create a CLIENT user with a password hash. The DB's email unique constraint
 *  is the authoritative guard against duplicates (the service catches P2002). */
export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      role: "CLIENT",
    },
    select: { id: true },
  });
}
