// Profile completeness for the therapist dashboard. A pure check over the
// fields a therapist must fill before requesting verification — drives both the
// progress indicator and the server-side gate on "request verification".

export type CompletenessInput = {
  title: string;
  bio: { en: string; he: string; fr: string };
  skills: string[];
  modalities: string[];
  languages: string[];
  sessionPrice: number;
};

export type Completeness = {
  percent: number;
  missing: string[];
  isComplete: boolean;
};

const CHECKS: { key: string; ok: (p: CompletenessInput) => boolean }[] = [
  { key: "title", ok: (p) => p.title.trim().length > 0 },
  {
    key: "bio",
    ok: (p) => !!p.bio.en.trim() && !!p.bio.he.trim() && !!p.bio.fr.trim(),
  },
  { key: "skills", ok: (p) => p.skills.length > 0 },
  { key: "modalities", ok: (p) => p.modalities.length > 0 },
  { key: "languages", ok: (p) => p.languages.length > 0 },
  { key: "price", ok: (p) => p.sessionPrice > 0 },
];

export function profileCompleteness(p: CompletenessInput): Completeness {
  const missing = CHECKS.filter((c) => !c.ok(p)).map((c) => c.key);
  const done = CHECKS.length - missing.length;
  return {
    percent: Math.round((done / CHECKS.length) * 100),
    missing,
    isComplete: missing.length === 0,
  };
}
