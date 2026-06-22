import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the OpenAI SDK so this tests the adapter's mapping/extraction without network.
const create = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { runOpenAi } from "./openai-provider";

describe("runOpenAi", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({
      choices: [{ message: { content: '{"state":"MIRROR","reply":"ok","matches":[]}' } }],
    });
  });

  it("forwards model + messages, requests JSON mode, and returns the content", async () => {
    const out = await runOpenAi("sk-test", "gpt-5.4", [
      { role: "system", content: "sys" },
      { role: "user", content: "hi" },
    ]);
    expect(out).toBe('{"state":"MIRROR","reply":"ok","matches":[]}');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.4",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "sys" },
          { role: "user", content: "hi" },
        ],
      }),
    );
  });

  it("returns an empty string if the model returns no content", async () => {
    create.mockResolvedValue({ choices: [{ message: { content: null } }] });
    expect(await runOpenAi("sk-test", "gpt-5.4", [])).toBe("");
  });
});
