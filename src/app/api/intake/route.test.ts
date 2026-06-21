import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the intake feature so the route is tested in isolation (no DB / model).
vi.mock("@/features/intake", async () => {
  const { z } = await import("zod");
  return {
    intakeRequestSchema: z.object({
      sessionId: z.string().min(1).optional(),
      message: z.string().min(1).max(4000),
      locale: z.enum(["he", "en", "fr"]),
    }),
    runIntakeTurn: vi.fn(),
  };
});

import { runIntakeTurn } from "@/features/intake";
import { POST } from "./route";

const mRun = vi.mocked(runIntakeTurn);

function post(body: unknown): Request {
  return new Request("http://localhost/api/intake", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.resetAllMocks());

describe("POST /api/intake", () => {
  it("runs the turn and returns the response for a valid request", async () => {
    mRun.mockResolvedValue({
      sessionId: "s1",
      assistantMessage: "hi",
      state: "GATHER",
      matches: [],
    });
    const res = await POST(post({ message: "hello", locale: "en" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sessionId: "s1", state: "GATHER" });
    expect(mRun).toHaveBeenCalledWith({ message: "hello", locale: "en" });
  });

  it("rejects an invalid body with 400 and never calls the engine", async () => {
    const res = await POST(post({ message: "", locale: "de" }));
    expect(res.status).toBe(400);
    expect(mRun).not.toHaveBeenCalled();
  });

  it("rejects non-JSON with 400", async () => {
    const bad = new Request("http://localhost/api/intake", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
    expect(mRun).not.toHaveBeenCalled();
  });

  it("returns a clean 502 (not an opaque 500) when the engine throws", async () => {
    mRun.mockRejectedValue(new Error("model timeout"));
    const res = await POST(post({ message: "hello", locale: "en" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "intake_failed" });
  });
});
