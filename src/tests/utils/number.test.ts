import {describe, expect, test} from "vitest";
import {getRandomPositiveInteger, getRandomPositiveIntegerInRange, mapRange, roundToTwoDecimalPlaces, seededRandom} from "../../utils/primitive/number";

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

describe("seededRandom", () => {
  test("all cases", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(seededRandom(i)).toBe(seededRandom(i));
      expect(seededRandom(i)).not.toBe(seededRandom(i + 1));
    }
  });
});

describe("roundToTwoDecimalPlaces", () => {
  test("zero", () => {
    expect(roundToTwoDecimalPlaces(0)).toBe(0);
  });

  test("integer", () => {
    expect(roundToTwoDecimalPlaces(1)).toBe(1);
    expect(roundToTwoDecimalPlaces(-1)).toBe(-1);
  });

  test("positive", () => {
    expect(roundToTwoDecimalPlaces(0.123456)).toBe(0.12);
    expect(roundToTwoDecimalPlaces(0.123456789)).toBe(0.12);
    expect(roundToTwoDecimalPlaces(0.1234)).toBe(0.12);
    expect(roundToTwoDecimalPlaces(0.123)).toBe(0.12);
  });

  test("negative", () => {
    expect(roundToTwoDecimalPlaces(-0.123456)).toBe(-0.12);
    expect(roundToTwoDecimalPlaces(-0.123456789)).toBe(-0.12);
    expect(roundToTwoDecimalPlaces(-0.1234)).toBe(-0.12);
    expect(roundToTwoDecimalPlaces(-0.123)).toBe(-0.12);
  });

  test("positive large", () => {
    expect(roundToTwoDecimalPlaces(123456789)).toBe(123456789);
    expect(roundToTwoDecimalPlaces(123456789.123456)).toBe(123456789.12);
    expect(roundToTwoDecimalPlaces(123456789.1234)).toBe(123456789.12);
    expect(roundToTwoDecimalPlaces(123456789.123)).toBe(123456789.12);
  });

  test("negative large", () => {
    expect(roundToTwoDecimalPlaces(-123456789)).toBe(-123456789);
    expect(roundToTwoDecimalPlaces(-123456789.123456)).toBe(-123456789.12);
    expect(roundToTwoDecimalPlaces(-123456789.1234)).toBe(-123456789.12);
    expect(roundToTwoDecimalPlaces(-123456789.123)).toBe(-123456789.12);
  });
});
