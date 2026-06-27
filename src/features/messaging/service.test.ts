import { describe, it, expect, vi, beforeEach } from "vitest";
import * as repo from "./repository";
import { sendMessage, getThread, getThreads } from "./service";

// Pure unit test of the owner-scoping + shared-appointment gate: the repository
// (the only DB-touching layer) is mocked, so these assert the SERVICE rules.
vi.mock("./repository", () => ({
  shareAppointment: vi.fn(),
  insertMessage: vi.fn(),
  listMessagesBetween: vi.fn(),
  markThreadRead: vi.fn(),
  recentMessagesFor: vi.fn(),
  unreadCountsBySender: vi.fn(),
}));

const m = vi.mocked(repo);

beforeEach(() => vi.resetAllMocks());

describe("sendMessage", () => {
  it("rejects a pair with NO shared appointment (not_allowed) and never writes", async () => {
    m.shareAppointment.mockResolvedValue(false);
    const r = await sendMessage("u1", { recipientId: "u2", body: "hi" });
    expect(r).toEqual({ ok: false, error: "not_allowed" });
    expect(m.insertMessage).not.toHaveBeenCalled();
  });

  it("rejects self-messaging without even checking eligibility", async () => {
    const r = await sendMessage("u1", { recipientId: "u1", body: "hi" });
    expect(r).toEqual({ ok: false, error: "self" });
    expect(m.shareAppointment).not.toHaveBeenCalled();
  });

  it("rejects an empty/whitespace body", async () => {
    const r = await sendMessage("u1", { recipientId: "u2", body: "   " });
    expect(r.ok).toBe(false);
    expect(m.insertMessage).not.toHaveBeenCalled();
  });

  it("sends when eligible and returns the message as fromMe", async () => {
    m.shareAppointment.mockResolvedValue(true);
    m.insertMessage.mockResolvedValue({
      id: "m1",
      senderId: "u1",
      body: "hi",
      createdAt: new Date("2026-06-28T10:00:00Z"),
    });
    const r = await sendMessage("u1", { recipientId: "u2", body: "hi" });
    expect(r).toEqual({
      ok: true,
      message: { id: "m1", fromMe: true, body: "hi", createdAtIso: "2026-06-28T10:00:00.000Z" },
    });
    expect(m.insertMessage).toHaveBeenCalledWith("u1", "u2", "hi");
  });
});

describe("getThread", () => {
  it("rejects a non-party (no shared appointment) and never reads the thread", async () => {
    m.shareAppointment.mockResolvedValue(false);
    const r = await getThread("u1", "u2");
    expect(r).toEqual({ ok: false, error: "not_allowed" });
    expect(m.listMessagesBetween).not.toHaveBeenCalled();
    expect(m.markThreadRead).not.toHaveBeenCalled();
  });

  it("returns the thread with fromMe flagged and marks incoming read", async () => {
    m.shareAppointment.mockResolvedValue(true);
    m.listMessagesBetween.mockResolvedValue([
      { id: "a", senderId: "u2", body: "hi", createdAt: new Date("2026-06-28T10:00:00Z") },
      { id: "b", senderId: "u1", body: "hello", createdAt: new Date("2026-06-28T10:01:00Z") },
    ]);
    m.markThreadRead.mockResolvedValue(1);
    const r = await getThread("u1", "u2");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages.map((x) => x.fromMe)).toEqual([false, true]);
    expect(m.markThreadRead).toHaveBeenCalledWith("u1", "u2");
  });
});

describe("getThreads", () => {
  it("derives one row per other party (newest wins) with name + unread", async () => {
    m.recentMessagesFor.mockResolvedValue([
      { senderId: "u2", recipientId: "u1", body: "latest from u2", createdAt: new Date("2026-06-28T12:00:00Z"), sender: { name: "Jane" }, recipient: { name: "Me" } },
      { senderId: "u1", recipientId: "u2", body: "older to u2", createdAt: new Date("2026-06-28T11:00:00Z"), sender: { name: "Me" }, recipient: { name: "Jane" } },
      { senderId: "u3", recipientId: "u1", body: "from u3", createdAt: new Date("2026-06-28T09:00:00Z"), sender: { name: "Sam" }, recipient: { name: "Me" } },
    ]);
    m.unreadCountsBySender.mockResolvedValue([{ senderId: "u2", _count: { _all: 2 } }]);
    const r = await getThreads("u1");
    expect(r).toEqual([
      { otherId: "u2", name: "Jane", lastMessage: "latest from u2", lastAtIso: "2026-06-28T12:00:00.000Z", unread: 2 },
      { otherId: "u3", name: "Sam", lastMessage: "from u3", lastAtIso: "2026-06-28T09:00:00.000Z", unread: 0 },
    ]);
  });
});
