import { describe, expect, test } from "vitest";
import { internString } from "@/core/utils/string/interner";

describe("internString", () => {
  test("returns a string equal to the one given", () => {
    expect(internString("baldurs_gate")).toBe("baldurs_gate");
  });

  test("returns the same value when a string is interned again", () => {
    const first = internString(["fi", "rst_tag"].join(""));

    expect(internString(["first", "_tag"].join(""))).toBe(first);
  });
});
