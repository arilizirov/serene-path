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
});
