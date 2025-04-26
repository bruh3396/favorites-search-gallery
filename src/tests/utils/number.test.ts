import {describe, expect, test} from "vitest";
import {getRandomPositiveInteger} from "../../utils/primitive/number";

describe("getRandomPositiveInteger", () => {
  test("zero", () => {
    expect(getRandomPositiveInteger(0)).toBe(0);
  });

  test("one", () => {
    expect(getRandomPositiveInteger(1)).toBeLessThanOrEqual(1);
    expect(getRandomPositiveInteger(1)).toBeGreaterThanOrEqual(0);
  });

  test("many", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(getRandomPositiveInteger(2000)).toBeLessThanOrEqual(2000);
      expect(getRandomPositiveInteger(2000)).toBeGreaterThanOrEqual(0);
    }
  });
});
