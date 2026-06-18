import { describe, it, expect } from "vitest";
import { toTherapistCard, type TherapistCardSource } from "./mapper";

const row: TherapistCardSource = {
  id: "t1",
  title: "Clinical Psychologist",
  skills: ["anxiety", "CBT"],
  bio: {
    en: "I help with anxiety. And more.",
    he: "אני עוזרת עם חרדה. ועוד.",
    fr: "J'aide avec l'anxiété. Et plus.",
  },
  user: { name: "Maya Cohen" },
};

describe("toTherapistCard", () => {
  it("localizes the tagline to the first sentence in the requested locale", () => {
    expect(toTherapistCard(row, "he").tagline).toBe("אני עוזרת עם חרדה.");
    expect(toTherapistCard(row, "en").tagline).toBe("I help with anxiety.");
  });

  it("falls back to English when the requested locale's bio is missing", () => {
    const partial: TherapistCardSource = { ...row, bio: { en: "English only." } };
    expect(toTherapistCard(partial, "fr").tagline).toBe("English only.");
  });

  it("uses the title as the name when the user has no name", () => {
    const anon: TherapistCardSource = { ...row, user: { name: null } };
    expect(toTherapistCard(anon, "en").name).toBe("Clinical Psychologist");
  });

  it("passes through id and skills unchanged", () => {
    const card = toTherapistCard(row, "en");
    expect(card.id).toBe("t1");
    expect(card.skills).toEqual(["anxiety", "CBT"]);
  });
});
