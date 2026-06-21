import type { Locale } from "@/lib/utils";
import type { TherapistCard, TherapistProfileView } from "./types";
import type {
  TherapistInput,
  AvailabilityRuleInput,
  TherapistStatusValue,
} from "./schema";
import {
  findVerifiedTherapists,
  findVerifiedForCatalog,
  createTherapist as repoCreateTherapist,
  createTherapistUser as repoCreateTherapistUser,
  updateTherapist as repoUpdateTherapist,
  getTherapistById as repoGetTherapistById,
  getProfileByUserId as repoGetProfileByUserId,
  updateProfileByUserId as repoUpdateProfileByUserId,
  requestVerificationByUser as repoRequestVerificationByUser,
  listAllTherapists as repoListAllTherapists,
  getAvailabilityRules as repoGetAvailabilityRules,
  replaceAvailabilityRules as repoReplaceAvailabilityRules,
  setTherapistStatus as repoSetTherapistStatus,
  getVerifiedTherapistById as repoGetVerifiedTherapistById,
  searchVerifiedTherapists as repoSearchVerifiedTherapists,
  getSchedulingContext as repoGetSchedulingContext,
  getAvailabilityExceptions as repoGetAvailabilityExceptions,
  addAvailabilityException as repoAddAvailabilityException,
  removeAvailabilityException as repoRemoveAvailabilityException,
} from "./repository";
import { toTherapistCard } from "./mapper";
import { isoToUtcDate, utcDateToIso } from "./exceptions";
import { hhmmToMinutes, minutesToHhmm } from "./availability";

/** One verified therapist as the AI matcher sees them (§5). Deliberately carries
 *  NO price or availability — the model must never see or invent those; the
 *  server resolves real slots after matching. */
export type CatalogEntry = {
  id: string;
  title: string;
  bio: string; // resolved to the requested locale
  skills: string[];
  languages: string[];
};

/** The eligible-therapist catalog for intake matching: every verified therapist,
 *  bio resolved to `locale`. */
export async function getMatchingCatalog(locale: Locale): Promise<CatalogEntry[]> {
  const rows = await findVerifiedForCatalog();
  return rows.map((r) => {
    const bio = (r.bio ?? {}) as Record<string, string>;
    return {
      id: r.id,
      title: r.title,
      bio: bio[locale] ?? bio.en ?? "",
      skills: r.skills,
      languages: r.languages,
    };
  });
}

/** Discovery list: every verified therapist as a localized card. */
export async function getDiscoverTherapists(
  locale: Locale,
): Promise<TherapistCard[]> {
  const rows = await findVerifiedTherapists();
  return rows.map((row) => toTherapistCard(row, locale));
}

/** A row in the admin therapist list. */
export type AdminTherapistRow = {
  id: string;
  name: string;
  email: string;
  title: string;
  status: string;
  languages: string[];
};

/** A therapist loaded for editing: the input shape plus identity + status. */
export type TherapistForEdit = TherapistInput & { id: string; status: string };

export async function createTherapist(input: TherapistInput): Promise<string> {
  const user = await repoCreateTherapist(input);
  if (!user.therapist) {
    throw new Error("therapist profile was not created");
  }
  return user.therapist.id;
}

export type SelfRegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/** Self-register a therapist: an atomic User(THERAPIST)+DRAFT profile, race-safe
 *  on the email unique constraint (create-then-catch P2002). The caller (app
 *  composition) hashes the password and starts the session. */
export async function selfRegisterTherapist(input: {
  email: string;
  name: string;
  passwordHash: string;
  title: string;
}): Promise<SelfRegisterResult> {
  try {
    const userId = await repoCreateTherapistUser(input);
    return { ok: true, userId };
  } catch (e) {
    // User.email is the only @unique on this nested write, so any P2002 is the
    // email collision (same rationale as accounts.isUniqueViolation).
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { ok: false, error: "That email is already registered." };
    }
    throw e;
  }
}

export async function updateTherapist(
  id: string,
  input: TherapistInput,
): Promise<void> {
  await repoUpdateTherapist(id, input);
}

export async function listTherapistsForAdmin(): Promise<AdminTherapistRow[]> {
  const rows = await repoListAllTherapists();
  return rows.map((r) => ({
    id: r.id,
    name: r.user.name ?? "—",
    email: r.user.email,
    title: r.title,
    status: r.status,
    languages: r.languages,
  }));
}

export async function getTherapistForEdit(
  id: string,
): Promise<TherapistForEdit | null> {
  const t = await repoGetTherapistById(id);
  if (!t) return null;
  const bio = (t.bio ?? {}) as { en?: string; he?: string; fr?: string };
  return {
    id: t.id,
    status: t.status,
    email: t.user.email,
    name: t.user.name ?? "",
    title: t.title,
    bio: { en: bio.en ?? "", he: bio.he ?? "", fr: bio.fr ?? "" },
    skills: t.skills,
    modalities: t.modalities,
    languages: t.languages,
    credentials: t.credentials ?? undefined,
    photoUrl: t.photoUrl ?? undefined,
    sessionPrice: Number(t.sessionPrice),
  };
}

/** A therapist's OWN profile for the dashboard edit form (scoped by userId). */
export async function getMyProfileForEdit(
  userId: string,
): Promise<TherapistForEdit | null> {
  const t = await repoGetProfileByUserId(userId);
  if (!t) return null;
  const bio = (t.bio ?? {}) as { en?: string; he?: string; fr?: string };
  return {
    id: t.id,
    status: t.status,
    email: t.user.email,
    name: t.user.name ?? "",
    title: t.title,
    bio: { en: bio.en ?? "", he: bio.he ?? "", fr: bio.fr ?? "" },
    skills: t.skills,
    modalities: t.modalities,
    languages: t.languages,
    credentials: t.credentials ?? undefined,
    photoUrl: t.photoUrl ?? undefined,
    sessionPrice: Number(t.sessionPrice),
  };
}

/** Save a therapist's OWN profile (owner-scoped by userId). */
export async function saveMyProfile(
  userId: string,
  input: TherapistInput,
): Promise<void> {
  await repoUpdateProfileByUserId(userId, input);
}

/** A therapist requests verification of their OWN profile (DRAFT → PENDING). */
export async function requestVerification(userId: string): Promise<void> {
  await repoRequestVerificationByUser(userId);
}

/** A therapist's weekly availability rules, with times as HH:MM. */
export async function getAvailabilityRules(
  therapistId: string,
): Promise<AvailabilityRuleInput[]> {
  const rows = await repoGetAvailabilityRules(therapistId);
  return rows.map((r) => ({
    weekday: r.weekday,
    start: minutesToHhmm(r.startMinute),
    end: minutesToHhmm(r.endMinute),
  }));
}

/** Replace a therapist's weekly rules (HH:MM in, minutes stored). */
export async function saveAvailabilityRules(
  therapistId: string,
  rules: AvailabilityRuleInput[],
): Promise<void> {
  await repoReplaceAvailabilityRules(
    therapistId,
    rules.map((r) => ({
      weekday: r.weekday,
      startMinute: hhmmToMinutes(r.start),
      endMinute: hhmmToMinutes(r.end),
    })),
  );
}

/** A therapist's blocked dates (whole-day exceptions) as YYYY-MM-DD strings. */
export async function getBlockedDates(
  therapistId: string,
): Promise<{ id: string; date: string }[]> {
  const rows = await repoGetAvailabilityExceptions(therapistId);
  return rows.map((r) => ({ id: r.id, date: utcDateToIso(r.date) }));
}

/**
 * Block a date for a therapist. No-op if that date is already blocked.
 * Dedupe is best-effort at the app level (no DB unique constraint): the
 * single-admin write pattern makes a concurrent double-insert unlikely, and a
 * unique([therapistId, date]) is deferred because it would conflict with the
 * future partial-day blocks (which allow several rows per date).
 */
export async function addBlockedDate(
  therapistId: string,
  isoDate: string,
): Promise<void> {
  const existing = await repoGetAvailabilityExceptions(therapistId);
  if (existing.some((r) => utcDateToIso(r.date) === isoDate)) return;
  await repoAddAvailabilityException(therapistId, isoToUtcDate(isoDate));
}

/** Remove a therapist's blocked date by id (scoped to that therapist). */
export async function removeBlockedDate(
  id: string,
  therapistId: string,
): Promise<void> {
  await repoRemoveAvailabilityException(id, therapistId);
}

/** Set a therapist's verification status (DRAFT → PENDING → VERIFIED …). */
export async function setTherapistStatus(
  id: string,
  status: TherapistStatusValue,
): Promise<void> {
  await repoSetTherapistStatus(id, status);
}

/** The public profile of a VERIFIED therapist, localized; null if not found. */
export async function getTherapistProfile(
  id: string,
  locale: Locale,
): Promise<TherapistProfileView | null> {
  const t = await repoGetVerifiedTherapistById(id);
  if (!t) return null;
  const bio = (t.bio ?? {}) as Record<string, unknown>;
  const candidate = bio[locale] ?? bio.en;
  return {
    id: t.id,
    name: t.user.name ?? t.title,
    title: t.title,
    bio: typeof candidate === "string" ? candidate : "",
    skills: t.skills,
    modalities: t.modalities,
    languages: t.languages,
    credentials: t.credentials,
    photoUrl: t.photoUrl,
    sessionPrice: Number(t.sessionPrice),
    rating: t.rating,
    reviewCount: t.reviewCount,
    availability: t.rules.map((r) => ({
      weekday: r.weekday,
      start: minutesToHhmm(r.startMinute),
      end: minutesToHhmm(r.endMinute),
    })),
  };
}

/** The timezone + weekly rules (HH:MM) the scheduling engine needs for a therapist. */
export type SchedulingContext = {
  timezone: string;
  rules: AvailabilityRuleInput[];
};

export async function getSchedulingContext(
  therapistId: string,
): Promise<SchedulingContext | null> {
  const row = await repoGetSchedulingContext(therapistId);
  if (!row) return null;
  return {
    timezone: row.user.timezone,
    rules: row.rules.map((r) => ({
      weekday: r.weekday,
      start: minutesToHhmm(r.startMinute),
      end: minutesToHhmm(r.endMinute),
    })),
  };
}

/** Directory search: VERIFIED therapists as localized cards, filtered. */
export async function searchTherapists(
  locale: Locale,
  filters: { q?: string; language?: string },
): Promise<TherapistCard[]> {
  const rows = await repoSearchVerifiedTherapists(filters);
  return rows.map((row) => toTherapistCard(row, locale));
}
