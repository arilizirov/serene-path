import { prisma } from "@/lib/db";

/** A user's auth fields by email, for credential sign-in. */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });
}

/** A user's role by id — used to mint a session whose role always matches the
 *  stored user (never a caller-supplied role). */
export function findUserRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
}

/** A user's contact fields by id — for sending them transactional mail. */
export function findUserContactById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
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
