import { describe, it, expect } from "vitest";
import { renderBookingConfirmation } from "./index";

describe("renderBookingConfirmation", () => {
  const base = {
    to: "client@example.com",
    therapistName: "Dr. Cohen",
    whenLabel: "Mon 6 Jul 14:00",
  };

  it("localizes subject + body in English", () => {
    const m = renderBookingConfirmation({ ...base, locale: "en" });
    expect(m.to).toBe("client@example.com");
    expect(m.subject).toBe("Your session is booked");
    expect(m.body).toContain("Dr. Cohen");
    expect(m.body).toContain("Mon 6 Jul 14:00");
  });

  it("localizes in Hebrew", () => {
    const m = renderBookingConfirmation({ ...base, locale: "he" });
    expect(m.subject).toBe("הפגישה שלך נקבעה");
    expect(m.body).toContain("Dr. Cohen");
    expect(m.body).toContain("Mon 6 Jul 14:00");
  });

  it("localizes in French", () => {
    const m = renderBookingConfirmation({ ...base, locale: "fr" });
    expect(m.subject).toBe("Votre séance est réservée");
    expect(m.body).toContain("Dr. Cohen");
  });

  it("falls back to English for an unknown locale", () => {
    const m = renderBookingConfirmation({ ...base, locale: "xx" });
    expect(m.subject).toBe("Your session is booked");
  });
});
