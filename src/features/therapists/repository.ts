import { prisma } from "@/lib/db";
import type { TherapistInput, TherapistStatusValue } from "./schema";

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

/** Verified therapists with exactly the fields the AI matcher may see (§5): no
 *  prices, no availability — the model must never see or invent those. */
export function findVerifiedForCatalog() {
  return prisma.therapistProfile.findMany({
    where: { status: "VERIFIED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      bio: true,
      skills: true,
      languages: true,
      user: { select: { name: true } },
    },
  });
}

/** Verified therapists with the fields the deterministic intake matcher needs
 *  (INTAKE_BUILD_SPEC §Step 7): languages + gender + skills + modalities + bio +
 *  rating. No availability — the scheduler resolves slots after a match. */
export function findVerifiedForMatching() {
  return prisma.therapistProfile.findMany({
    where: { status: "VERIFIED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      languages: true,
      gender: true,
      skills: true,
      modalities: true,
      bio: true,
      rating: true,
      user: { select: { name: true } },
    },
  });
}

/** Create a therapist: a User (role THERAPIST) with a nested profile (DRAFT). */
export function createTherapist(input: TherapistInput) {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: "THERAPIST",
      therapist: {
        create: {
          title: input.title,
          bio: input.bio,
          skills: input.skills,
          modalities: input.modalities,
          languages: input.languages,
          credentials: input.credentials ?? null,
          photoUrl: input.photoUrl ?? null,
          sessionPrice: input.sessionPrice,
        },
      },
    },
    include: { therapist: { select: { id: true } } },
  });
}

/** Self-signup: create a THERAPIST User (with password) + a DRAFT profile in one
 *  atomic nested write. Returns the new user id. Email unique → P2002 on dup. */
export async function createTherapistUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  title: string;
}): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      role: "THERAPIST",
      therapist: {
        create: {
          title: input.title,
          bio: { en: "", he: "", fr: "" },
          skills: [],
          modalities: [],
          languages: [],
          sessionPrice: 0,
          status: "DRAFT",
        },
      },
    },
    select: { id: true },
  });
  return user.id;
}

/** Update a profile's editable fields (and the owner's display name). */
export function updateTherapist(id: string, input: TherapistInput) {
  return prisma.therapistProfile.update({
    where: { id },
    data: {
      title: input.title,
      bio: input.bio,
      skills: input.skills,
      modalities: input.modalities,
      languages: input.languages,
      credentials: input.credentials ?? null,
      photoUrl: input.photoUrl ?? null,
      sessionPrice: input.sessionPrice,
      user: { update: { name: input.name } },
    },
    select: { id: true },
  });
}

/** Update a therapist's OWN profile, scoped by userId (the session owner) — a
 *  therapist can only edit their own. Email + role are never touched. */
export function updateProfileByUserId(userId: string, input: TherapistInput) {
  return prisma.therapistProfile.update({
    where: { userId },
    data: {
      title: input.title,
      bio: input.bio,
      skills: input.skills,
      modalities: input.modalities,
      languages: input.languages,
      credentials: input.credentials ?? null,
      photoUrl: input.photoUrl ?? null,
      sessionPrice: input.sessionPrice,
      user: { update: { name: input.name } },
    },
    select: { id: true },
  });
}

/** A therapist's OWN profile for editing (by userId). */
export function getProfileByUserId(userId: string) {
  return prisma.therapistProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, name: true } } },
  });
}

/** Move a therapist's OWN profile DRAFT → PENDING (owner-scoped + state-guarded). */
export function requestVerificationByUser(userId: string) {
  return prisma.therapistProfile.updateMany({
    where: { userId, status: "DRAFT" },
    data: { status: "PENDING" },
  });
}

/** Full profile for the admin edit form. */
export function getTherapistById(id: string) {
  return prisma.therapistProfile.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
}

/** Every therapist (any status) for the admin list. */
export function listAllTherapists() {
  return prisma.therapistProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      languages: true,
      user: { select: { name: true, email: true } },
    },
  });
}

/** A therapist's weekly availability rules (minutes from local midnight). */
export function getAvailabilityRules(therapistId: string) {
  return prisma.availabilityRule.findMany({
    where: { therapistId },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
    select: { weekday: true, startMinute: true, endMinute: true },
  });
}

/** Replace all of a therapist's weekly rules atomically. */
export function replaceAvailabilityRules(
  therapistId: string,
  rules: { weekday: number; startMinute: number; endMinute: number }[],
) {
  return prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { therapistId } }),
    prisma.availabilityRule.createMany({
      data: rules.map((r) => ({ therapistId, ...r })),
    }),
  ]);
}

/** A therapist's blocked dates (whole-day availability exceptions), ascending. */
export function getAvailabilityExceptions(therapistId: string) {
  return prisma.availabilityException.findMany({
    where: { therapistId, isBlocked: true },
    orderBy: { date: "asc" },
    select: { id: true, date: true },
  });
}

/** Add a whole-day blocked date for a therapist. */
export function addAvailabilityException(therapistId: string, date: Date) {
  return prisma.availabilityException.create({
    data: { therapistId, date, isBlocked: true },
    select: { id: true },
  });
}

/** Remove a blocked date by id, scoped to its therapist. deleteMany (not delete)
 *  so a mismatched therapistId is a no-op, not a throw — guards against deleting
 *  another therapist's row by raw id (IDOR) once admin auth lands in Stage 4. */
export function removeAvailabilityException(id: string, therapistId: string) {
  return prisma.availabilityException.deleteMany({ where: { id, therapistId } });
}

/** Update a therapist's verification status. */
export function setTherapistStatus(id: string, status: TherapistStatusValue) {
  return prisma.therapistProfile.update({
    where: { id },
    data: { status },
    select: { id: true },
  });
}

/** A single VERIFIED therapist with everything the public profile page needs. */
export function getVerifiedTherapistById(id: string) {
  return prisma.therapistProfile.findFirst({
    where: { id, status: "VERIFIED" },
    include: {
      user: { select: { name: true } },
      rules: {
        orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
        select: { weekday: true, startMinute: true, endMinute: true },
      },
    },
  });
}

/** The timezone + weekly rules a therapist's next-available slot is computed from. */
export function getSchedulingContext(therapistId: string) {
  return prisma.therapistProfile.findUnique({
    where: { id: therapistId },
    select: {
      user: { select: { timezone: true } },
      rules: {
        orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
        select: { weekday: true, startMinute: true, endMinute: true },
      },
    },
  });
}

/** VERIFIED therapists for the public directory, filtered by free text + language. */
export function searchVerifiedTherapists(filters: {
  q?: string;
  language?: string;
}) {
  const { q, language } = filters;
  return prisma.therapistProfile.findMany({
    where: {
      status: "VERIFIED",
      ...(language ? { languages: { has: language } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { user: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
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
