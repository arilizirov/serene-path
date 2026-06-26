import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the intake feature so the route is tested in isolation (no DB / model). ONE
// live flow behind the seam: intakeTurnRequestSchema validates the body, then
// getIntakeProvider().handle runs the turn.
const mHandle = vi.fn();
vi.mock("@/features/intake", async () => {
  const { z } = await import("zod");
  return {
    intakeTurnRequestSchema: z.object({
      sessionId: z.string().min(1).optional(),
      locale: z.enum(["he", "en", "fr"]),
      text: z.string().trim().min(1).max(4000).optional(),
      choice: z.string().min(1).max(64).optional(),
      action: z.enum(["browse_all", "human_followup", "get_help_now"]).optional(),
    }),
    getIntakeProvider: vi.fn(() => ({ handle: mHandle })),
  };
});

import { POST } from "./route";
import { getIntakeProvider } from "@/features/intake";

const mGetProvider = vi.mocked(getIntakeProvider);

function post(body: unknown): Request {
  return new Request("http://localhost/api/intake", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/intake", () => {
  it("runs the turn and returns the response for a valid request", async () => {
    mHandle.mockResolvedValue({
      sessionId: "s1",
      assistantMessage: "hi",
      state: "GATHER",
      matches: [],
    });
    const res = await POST(post({ text: "hello", locale: "en" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sessionId: "s1", state: "GATHER" });
    expect(mHandle).toHaveBeenCalledWith({ text: "hello", locale: "en" });
  });

  it("resolves the live intake provider for a valid turn", async () => {
    mHandle.mockResolvedValue({ sessionId: "s1", assistantMessage: "hi", state: "GATHER", matches: [] });
    await POST(post({ choice: "yes", locale: "en" }));
    expect(mGetProvider).toHaveBeenCalled();
  });

  it("accepts a bare {locale} (starts the flow → static greeting)", async () => {
    mHandle.mockResolvedValue({ sessionId: "s1", assistantMessage: "greeting", state: "GREETING", matches: [] });
    const res = await POST(post({ locale: "he" }));
    expect(res.status).toBe(200);
    expect(mHandle).toHaveBeenCalledWith({ locale: "he" });
  });

  it("rejects an invalid body with 400 and never calls the engine", async () => {
    const res = await POST(post({ locale: "de" }));
    expect(res.status).toBe(400);
    expect(mHandle).not.toHaveBeenCalled();
  });

  it("rejects non-JSON with 400", async () => {
    const bad = new Request("http://localhost/api/intake", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
    expect(mHandle).not.toHaveBeenCalled();
  });

  it("returns a clean 502 (not an opaque 500) when the engine throws", async () => {
    mHandle.mockRejectedValue(new Error("model timeout"));
    const res = await POST(post({ text: "hello", locale: "en" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "intake_failed" });
  });
});
