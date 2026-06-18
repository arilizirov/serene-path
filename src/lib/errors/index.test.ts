import { describe, it, expect } from "vitest";
import { AppError, toErrorBody, toErrorResponse } from "./index";

describe("toErrorBody", () => {
  it("wraps a code + message in the { error: { code, message } } shape (§11)", () => {
    expect(toErrorBody("not_found", "No such therapist")).toEqual({
      error: { code: "not_found", message: "No such therapist" },
    });
  });
});

describe("toErrorResponse", () => {
  it("maps an AppError to its status, code, and message", () => {
    const e = new AppError("forbidden", "Not allowed", 403);
    expect(toErrorResponse(e)).toEqual({
      status: 403,
      body: { error: { code: "forbidden", message: "Not allowed" } },
    });
  });

  it("maps an unknown error to a generic 500 WITHOUT leaking its message", () => {
    const e = new Error("Postgres password is hunter2");
    const res = toErrorResponse(e);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("internal_error");
    expect(res.body.error.message).not.toContain("hunter2");
  });
});
