import { chain, doNothing } from "@/core/utils/function/function";
import { describe, expect, test } from "vitest";

describe("doNothing", () => {
  test("returns undefined", () => {
    expect(doNothing()).toBeUndefined();
  });

  test("does not throw", () => {
    expect(() => doNothing()).not.toThrow();
  });
});

describe("chain", () => {
  test("returns the initial value with no functions", () => {
    expect(chain(5)).toBe(5);
  });

  test("applies a single function", () => {
    expect(chain(5, x => x + 1)).toBe(6);
  });

  test("applies functions left to right", () => {
    expect(chain(2, x => x + 3, x => x * 2)).toBe(10);
  });

  test("gives a different result when the order changes", () => {
    expect(chain(2, x => x * 2, x => x + 3)).toBe(7);
  });

  test("chains string functions", () => {
    expect(chain("a", s => `${s}b`, s => `${s}c`)).toBe("abc");
  });
});
