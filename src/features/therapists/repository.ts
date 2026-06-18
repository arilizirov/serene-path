import { prisma } from "@/lib/db";

/** Verified therapists for discovery, with just the fields a card needs. */
export function findVerifiedTherapists() {
  return prisma.therapistProfile.findMany({
    where: { status: "VERIFIED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      skills: true,
      bio: true,
      user: { select: { name: true } },
    },
  });
}
