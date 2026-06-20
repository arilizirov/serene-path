import { describe, it, expect } from "vitest";
import { formDataToTherapistInput } from "./form-parsing";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("formDataToTherapistInput", () => {
  it("assembles localized bio and splits comma-separated lists (trimming blanks)", () => {
    const input = formDataToTherapistInput(
      fd({
        email: "a@b.com",
        name: "A",
        title: "T",
        bioEn: "en",
        bioHe: "he",
        bioFr: "fr",
        skills: "anxiety, burnout , CBT",
        modalities: "individual",
        languages: "he, en",
        sessionPrice: "320",
      }),
    ) as Record<string, unknown>;
    expect(input.bio).toEqual({ en: "en", he: "he", fr: "fr" });
    expect(input.skills).toEqual(["anxiety", "burnout", "CBT"]);
    expect(input.languages).toEqual(["he", "en"]);
    expect(input.sessionPrice).toBe("320");
  });

  it("maps blank optional fields to undefined", () => {
    const input = formDataToTherapistInput(
      fd({ credentials: "", photoUrl: "" }),
    ) as Record<string, unknown>;
    expect(input.credentials).toBeUndefined();
    expect(input.photoUrl).toBeUndefined();
  });
});
