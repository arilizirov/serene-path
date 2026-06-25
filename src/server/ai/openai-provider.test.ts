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
      usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
    });
  });

  it("forwards model + messages, requests JSON mode, and returns the content + usage", async () => {
    const out = await runOpenAi("sk-test", "gpt-5.4", [
      { role: "system", content: "sys" },
      { role: "user", content: "hi" },
    ]);
    expect(out.text).toBe('{"state":"MIRROR","reply":"ok","matches":[]}');
    expect(out.usage).toEqual({ promptTokens: 12, completionTokens: 8, totalTokens: 20 });
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

  it("returns an empty string + null usage if the model returns no content/usage", async () => {
    create.mockResolvedValue({ choices: [{ message: { content: null } }] });
    const out = await runOpenAi("sk-test", "gpt-5.4", []);
    expect(out.text).toBe("");
    expect(out.usage).toBeNull();
  });
});
