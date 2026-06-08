import { describe, expect, test } from "vitest";
import { decodeTagCategory, encodeTagCategory } from "@/lib/remote/parsers/api_tag_parser";

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

  test("defaults to general for unknown encoding", () => {
    expect(decodeTagCategory(99)).toBe("general");
  });
});

describe("encodeTagCategory", () => {
  test("encodes known tag types", () => {
    expect(encodeTagCategory("tag")).toBe(0);
    expect(encodeTagCategory("artist")).toBe(1);
    expect(encodeTagCategory("copyright")).toBe(3);
    expect(encodeTagCategory("character")).toBe(4);
    expect(encodeTagCategory("metadata")).toBe(5);
  });

  test("defaults to null for unknown type", () => {
    expect(encodeTagCategory("unknown")).toBe(null);
    expect(encodeTagCategory("")).toBe(null);
    expect(encodeTagCategory("bogus")).toBe(null);
  });
});
