import { describe, expect, it } from "vitest";
import { buildEmbeddingContents } from "@/lib/embedding-input";

describe("Gemini embedding inputs", () => {
  it("creates one Content object per knowledge chunk", () => {
    expect(buildEmbeddingContents(["First chunk", "Second chunk"])).toEqual([
      { parts: [{ text: "First chunk" }] },
      { parts: [{ text: "Second chunk" }] },
    ]);
  });
});
