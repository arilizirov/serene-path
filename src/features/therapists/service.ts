import type { Locale } from "@/lib/utils";
import type { TherapistCard } from "./types";
import type { TherapistInput, AvailabilityRuleInput } from "./schema";
import {
  findVerifiedTherapists,
  createTherapist as repoCreateTherapist,
  updateTherapist as repoUpdateTherapist,
  getTherapistById as repoGetTherapistById,
  listAllTherapists as repoListAllTherapists,
  getAvailabilityRules as repoGetAvailabilityRules,
  replaceAvailabilityRules as repoReplaceAvailabilityRules,
} from "./repository";
import { toTherapistCard } from "./mapper";
import { hhmmToMinutes, minutesToHhmm } from "./availability";

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
