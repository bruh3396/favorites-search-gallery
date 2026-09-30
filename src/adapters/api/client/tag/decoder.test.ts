import { describe, expect, test } from "vitest";
import { decodeTagCategory } from "@/adapters/api/client/tag/decoder";

describe("decodeTagCategory", () => {
  test("decodes known encodings", () => {
    expect(decodeTagCategory(0)).toBe("general");
    expect(decodeTagCategory(1)).toBe("artist");
    expect(decodeTagCategory(2)).toBe("unknown");
    expect(decodeTagCategory(3)).toBe("copyright");
    expect(decodeTagCategory(4)).toBe("character");
    expect(decodeTagCategory(5)).toBe("metadata");
  });

  test("defaults to general for null", () => {
    expect(decodeTagCategory(null)).toBe("general");
  });
});
