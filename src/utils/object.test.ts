import { describe, expect, test } from "vitest";
import { isRecord, readString } from "@/utils/object";

describe("isRecord", () => {
  test("accepts an object", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  test("accepts an array", () => {
    expect(isRecord([1, 2])).toBe(true);
  });

  test("rejects null", () => {
    expect(isRecord(null)).toBe(false);
  });

  test("rejects undefined", () => {
    expect(isRecord(undefined)).toBe(false);
  });

  test("rejects a string", () => {
    expect(isRecord("a")).toBe(false);
  });

  test("rejects a number", () => {
    expect(isRecord(1)).toBe(false);
  });
});

describe("readString", () => {
  test("reads a string field", () => {
    expect(readString({ name: "boys" }, "name")).toBe("boys");
  });

  test("returns empty when the field is missing", () => {
    expect(readString({}, "name")).toBe("");
  });

  test("returns empty when the field is not a string", () => {
    expect(readString({ name: 42 }, "name")).toBe("");
  });

  test("returns empty when the value is not a record", () => {
    expect(readString("boys", "name")).toBe("");
  });

  test("returns empty when the value is null", () => {
    expect(readString(null, "name")).toBe("");
  });

  test("uses the given fallback", () => {
    expect(readString({}, "name", "none")).toBe("none");
  });

  test("prefers the field over the fallback", () => {
    expect(readString({ name: "boys" }, "name", "none")).toBe("boys");
  });

  test("keeps an empty string field", () => {
    expect(readString({ name: "" }, "name", "none")).toBe("");
  });
});
