import { describe, it, expect } from "vitest";
import {
  CONCERN_IDS,
  STYLE_IDS,
  LANGUAGE_IDS,
  GENDER_PREF_IDS,
  CONFIRM_IDS,
  SECONDARY_ACTIONS,
} from "./contract";

// Lock the stable chip IDs to the spec (INTAKE_BUILD_SPEC §Chip sets). These are a
// contract with the frontend (localized by id) and the matcher — drift is silent.
describe("intake chip IDs", () => {
  it("concern set is exactly the spec's 8 ids", () => {
    expect([...CONCERN_IDS]).toEqual([
      "anxiety",
      "stress_burnout",
      "relationships",
      "trauma",
      "grief",
      "sleep",
      "depression",
      "something_else",
    ]);
  });

  it("style / language / genderPreference / confirm sets match the spec", () => {
    expect([...STYLE_IDS]).toEqual(["practical_tools", "explore_feelings", "mindfulness", "faith_aligned"]);
    expect([...LANGUAGE_IDS]).toEqual(["he", "en", "fr"]);
    expect([...GENDER_PREF_IDS]).toEqual(["no_preference", "female", "male"]);
    expect([...CONFIRM_IDS]).toEqual(["yes", "not_quite"]);
  });

  it("persistent secondary actions match the spec", () => {
    expect([...SECONDARY_ACTIONS]).toEqual(["browse_all", "human_followup", "get_help_now"]);
  });
});
