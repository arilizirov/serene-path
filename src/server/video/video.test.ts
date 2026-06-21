import { describe, it, expect } from "vitest";
import { roomNameForAppointment, issueRoomCredentials } from "./index";

describe("video stub adapter", () => {
  it("derives a deterministic room name per appointment", () => {
    expect(roomNameForAppointment("a1")).toBe("appt-a1");
    expect(roomNameForAppointment("a1")).toBe(roomNameForAppointment("a1"));
    expect(roomNameForAppointment("a2")).not.toBe(roomNameForAppointment("a1"));
  });

  it("issues credentials scoped to the appointment room + identity + role", async () => {
    const c = await issueRoomCredentials("a1", "user-7", "THERAPIST");
    expect(c.roomName).toBe("appt-a1");
    expect(c.identity).toBe("user-7");
    expect(c.role).toBe("THERAPIST");
    // Stub token is clearly non-functional and carries the binding.
    expect(c.token).toContain("stub-token");
    expect(c.token).toContain("appt-a1");
    expect(c.token).toContain("user-7");
  });

  it("puts both parties of one appointment in the same room", async () => {
    const client = await issueRoomCredentials("a9", "client-1", "CLIENT");
    const ther = await issueRoomCredentials("a9", "ther-1", "THERAPIST");
    expect(client.roomName).toBe(ther.roomName);
    expect(client.token).not.toBe(ther.token); // but distinct join tokens
  });
});
