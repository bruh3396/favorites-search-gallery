import {describe, expect, test} from "vitest";
import {getRandomPositiveInteger, getRandomPositiveIntegerInRange, mapRange} from "../../utils/primitive/number";

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

describe("mapRange", () => {
  test("positive", () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    expect(mapRange(2.5, 0, 10, 0, 100)).toBe(25);
  });

  test("negative", () => {
    expect(mapRange(-5, -10, 0, 0, 100)).toBe(50);
    expect(mapRange(-10, -10, 0, 0, 100)).toBe(0);
    expect(mapRange(0, -10, 0, 0, 100)).toBe(100);
  });

  test("inverted", () => {
    expect(mapRange(0, 0, 10, 100, 0)).toBe(100);
    expect(mapRange(10, 0, 10, 100, 0)).toBe(0);
    expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
  });
});

describe("getRandomPositiveIntegerInRange", () => {
  test("0 min max", () => {
    expect(getRandomPositiveIntegerInRange(0, 0)).toBe(0);
  });

  test("range", () => {
    for (let i = 0; i < 100; i += 1) {
      const value = getRandomPositiveIntegerInRange(0, 20);

      expect(value).toBeLessThanOrEqual(20);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});
