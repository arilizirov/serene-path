import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMatchCandidates } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import { pickTherapist } from "./matching";

vi.mock("@/features/therapists", () => ({ getMatchCandidates: vi.fn() }));
vi.mock("@/features/scheduling", () => ({ getNextAvailable: vi.fn() }));
const mCand = vi.mocked(getMatchCandidates);
const mNext = vi.mocked(getNextAvailable);

type Cand = Awaited<ReturnType<typeof getMatchCandidates>>[number];
const cand = (over: Partial<Cand>): Cand => ({
  id: "t",
  name: "Dr. X",
  languages: ["en"],
  gender: null,
  skills: [],
  modalities: [],
  bio: { en: "" },
  rating: 0,
  religiousAlignment: null,
  offersSlidingScale: false,
  acceptsInsurance: false,
  acceptsSoldierSubsidy: false,
  availabilityTags: [],
  acceptingNewClients: true,
  ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  mNext.mockResolvedValue("2030-01-01T09:00:00.000Z");
});

describe("pickTherapist", () => {
  it("matches a concern specialist and grounds the rationale in a bio quote", async () => {
    mCand.mockResolvedValue([
      cand({ id: "a", name: "Dr. A", skills: ["anxiety", "panic"], modalities: ["cbt"], bio: { en: "I help with anxiety and panic. I use CBT." } }),
    ]);
    const r = await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en", genderPreference: "no_preference" }, "en");
    expect(r?.match.therapistId).toBe("a");
    expect(r?.match.rationaleSource.field).toBe("bio");
    expect(r?.match.rationaleSource.quote.toLowerCase()).toContain("anxiety");
    expect(r?.match.nextAvailable).toBe("2030-01-01T09:00:00.000Z");
    expect(r?.assistantMessage).toContain("Dr. A");
  });

  it("returns null when nobody covers the concern (→ CLARIFY)", async () => {
    mCand.mockResolvedValue([cand({ skills: ["couples"], modalities: ["emotion"], bio: { en: "Couples work." } })]);
    expect(await pickTherapist({ concern: "grief", style: "explore_feelings", language: "en" }, "en")).toBeNull();
  });

  it("applies the language hard filter", async () => {
    mCand.mockResolvedValue([cand({ languages: ["he"], skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" } })]);
    expect(await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en" }, "en")).toBeNull();
  });

  it("applies the gender hard filter", async () => {
    mCand.mockResolvedValue([cand({ gender: "MALE", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" } })]);
    expect(await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en", genderPreference: "female" }, "en")).toBeNull();
  });

  it("breaks ties by rating", async () => {
    mCand.mockResolvedValue([
      cand({ id: "low", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, rating: 3 }),
      cand({ id: "high", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, rating: 5 }),
    ]);
    const r = await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en" }, "en");
    expect(r?.match.therapistId).toBe("high");
  });

  it("uses therapistGender (fit form) as the gender hard filter", async () => {
    mCand.mockResolvedValue([cand({ gender: "MALE", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" } })]);
    expect(
      await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en", therapistGender: "female" }, "en"),
    ).toBeNull();
  });

  it("excludes therapists not accepting new clients (hard filter)", async () => {
    mCand.mockResolvedValue([
      cand({ skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, acceptingNewClients: false }),
    ]);
    expect(await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en" }, "en")).toBeNull();
  });

  it("applies the fee hard filter — sliding_scale excludes a therapist who doesn't offer it", async () => {
    mCand.mockResolvedValue([
      cand({ skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, offersSlidingScale: false }),
    ]);
    expect(
      await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en", fee: "sliding_scale" }, "en"),
    ).toBeNull();
  });

  it("fee=insurance keeps only therapists who accept insurance", async () => {
    mCand.mockResolvedValue([
      cand({ id: "no", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, acceptsInsurance: false }),
      cand({ id: "yes", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, acceptsInsurance: true }),
    ]);
    const r = await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en", fee: "insurance" }, "en");
    expect(r?.match.therapistId).toBe("yes");
  });

  it("fee=standard applies NO fee filter", async () => {
    mCand.mockResolvedValue([
      cand({ skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, offersSlidingScale: false, acceptsInsurance: false }),
    ]);
    const r = await pickTherapist({ concern: "anxiety", style: "practical_tools", language: "en", fee: "standard" }, "en");
    expect(r?.match.therapistId).toBe("t");
  });

  it("religion is SOFT — ranks a matching alignment up, never excludes", async () => {
    mCand.mockResolvedValue([
      cand({ id: "secular", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, religiousAlignment: "secular", rating: 5 }),
      cand({ id: "dati", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, religiousAlignment: "dati", rating: 5 }),
    ]);
    // Same concern+style score; the dati match wins on religiousSoft despite equal rating.
    const r = await pickTherapist(
      { concern: "anxiety", style: "practical_tools", language: "en", therapistReligion: "dati" }, "en",
    );
    expect(r?.match.therapistId).toBe("dati");
    // But a non-matching alignment is NOT excluded — with only the secular therapist, still matches.
    mCand.mockResolvedValue([
      cand({ id: "secular", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, religiousAlignment: "secular" }),
    ]);
    const r2 = await pickTherapist(
      { concern: "anxiety", style: "practical_tools", language: "en", therapistReligion: "dati" }, "en",
    );
    expect(r2?.match.therapistId).toBe("secular");
  });

  it("something_else never matches on soft signals alone (no concern classified → CLARIFY)", async () => {
    // A therapist who matches the user's STYLE and religion (style+soft = minScore)
    // but whose concern was never classifiable (something_else carries no concern
    // keywords). Recommending here would match a user whose distress we can't name.
    mCand.mockResolvedValue([
      cand({ id: "x", skills: [], modalities: ["cbt"], bio: { en: "I use CBT." }, religiousAlignment: "dati" }),
    ]);
    const r = await pickTherapist(
      { concern: "something_else", style: "practical_tools", language: "en", therapistReligion: "dati" },
      "en",
    );
    expect(r).toBeNull();
  });

  it("an unset concern also requires a real concern-term match", async () => {
    mCand.mockResolvedValue([
      cand({ id: "x", skills: [], modalities: ["cbt"], bio: { en: "I use CBT." } }),
    ]);
    const r = await pickTherapist({ style: "practical_tools", language: "en" }, "en");
    expect(r).toBeNull();
  });

  it("availability is SOFT — overlapping tag ranks up, flexible skips the effect", async () => {
    mCand.mockResolvedValue([
      cand({ id: "day", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, availabilityTags: ["weekday_day"], rating: 5 }),
      cand({ id: "eve", skills: ["anxiety"], modalities: ["cbt"], bio: { en: "anxiety" }, availabilityTags: ["evenings"], rating: 5 }),
    ]);
    const r = await pickTherapist(
      { concern: "anxiety", style: "practical_tools", language: "en", availability: "evenings" }, "en",
    );
    expect(r?.match.therapistId).toBe("eve");
  });
});
