import { describe, expect, test } from "vitest";
import { StringInterner } from "@/core/utils/string/string_interner";

describe("StringInterner", () => {
  describe("intern", () => {
    test("returns a string equal to the one given", () => {
      expect(new StringInterner().intern("baldurs_gate")).toBe("baldurs_gate");
    });

    test("returns the same value when a string is interned again", () => {
      const interner = new StringInterner();
      const first = interner.intern(["fi", "rst_tag"].join(""));

      expect(interner.intern(["first", "_tag"].join(""))).toBe(first);
    });
  });
});
