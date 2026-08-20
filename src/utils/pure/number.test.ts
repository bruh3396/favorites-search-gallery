import {
  average,
  clamp,
  navigationDelta,
  numbersAround,
  numbersInRange,
  randomBoolean,
  randomFloatInRange,
  randomInt,
  randomIntInRange,
  rescale,
  roundDownToMultiple,
  roundToTwoDecimalPlaces,
  roundUpToMultiple,
  seededFloat,
  sum,
  toSeconds
} from "@/utils/pure/number";
import { describe, expect, test } from "vitest";

describe("getRandomPositiveInteger", () => {
  test("zero", () => {
    expect(randomInt(0)).toBe(0);
  });

  test("one", () => {
    expect(randomInt(1)).toBeLessThanOrEqual(1);
    expect(randomInt(1)).toBeGreaterThanOrEqual(0);
  });

  test("many", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(randomInt(2000)).toBeLessThanOrEqual(2000);
      expect(randomInt(2000)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("rescale", () => {
  test("positive", () => {
    expect(rescale(5, 0, 10, 0, 100)).toBe(50);
    expect(rescale(0, 0, 10, 0, 100)).toBe(0);
    expect(rescale(10, 0, 10, 0, 100)).toBe(100);
    expect(rescale(2.5, 0, 10, 0, 100)).toBe(25);
  });

  test("negative", () => {
    expect(rescale(-5, -10, 0, 0, 100)).toBe(50);
    expect(rescale(-10, -10, 0, 0, 100)).toBe(0);
    expect(rescale(0, -10, 0, 0, 100)).toBe(100);
  });

  test("inverted", () => {
    expect(rescale(0, 0, 10, 100, 0)).toBe(100);
    expect(rescale(10, 0, 10, 100, 0)).toBe(0);
    expect(rescale(5, 0, 10, 100, 0)).toBe(50);
  });
});

describe("getRandomPositiveIntegerInRange", () => {
  test("0 min max", () => {
    expect(randomIntInRange(0, 0)).toBe(0);
  });

  test("range", () => {
    for (let i = 0; i < 100; i += 1) {
      const value = randomIntInRange(0, 20);

      expect(value).toBeLessThanOrEqual(20);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("seededRandom", () => {
  test("all cases", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(seededFloat(i)).toBe(seededFloat(i));
      expect(seededFloat(i)).not.toBe(seededFloat(i + 1));
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

describe("toSeconds", () => {
  test("zero", () => {
    expect(toSeconds(0)).toBe(0);
  });

  test("normal cases", () => {
    expect(toSeconds(1000)).toBe(1);
    expect(toSeconds(2000)).toBe(2);
    expect(toSeconds(5000)).toBe(5);
    expect(toSeconds(500)).toBe(0.5);
    expect(toSeconds(123456)).toBe(123.46);
  });

  test("rounding", () => {
    expect(toSeconds(123.456)).toBe(0.12);
    expect(toSeconds(1234.567)).toBe(1.23);
  });
});

describe("randomFloatInRange", () => {
  test("zero", () => {
    expect(randomFloatInRange(0, 0)).toBe(0);
  });

  test("normal", () => {
    for (let i = 0; i < 100; i += 1) {
      const value = randomFloatInRange(0, 20);

      expect(value).toBeLessThanOrEqual(20);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("sum", () => {
  test("empty", () => {
    expect(sum([])).toBe(0);
  });

  test("single", () => {
    expect(sum([5])).toBe(5);
    expect(sum([-5])).toBe(-5);
  });

  test("multiple", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([1, -2, 3])).toBe(2);
    expect(sum([-1, -2, -3])).toBe(-6);
  });

  test("decimals", () => {
    expect(sum([0.1, 0.2])).toBeCloseTo(0.3);
  });
});

describe("average", () => {
  test("empty", () => {
    expect(average([])).toBe(0);
  });

  test("single", () => {
    expect(average([4])).toBe(4);
    expect(average([-4])).toBe(-4);
  });

  test("multiple", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(average([0, 10])).toBe(5);
    expect(average([-10, 10])).toBe(0);
  });

  test("decimals", () => {
    expect(average([1, 2])).toBe(1.5);
    expect(average([1, 1, 2])).toBeCloseTo(1.333);
  });
});

describe("clamp", () => {
  test("zero", () => {
    expect(clamp(0, 0, 0)).toBe(0);
    expect(clamp(1, 0, 0)).toBe(0);
    expect(clamp(10, 0, 0)).toBe(0);
  });

  test("invalid range", () => {
    expect(clamp(10, 100, 0)).toBe(100);
  });

  test("no clamp", () => {
    expect(clamp(10, 0, 20)).toBe(10);
    expect(clamp(11, 0, 20)).toBe(11);
    expect(clamp(12, 0, 20)).toBe(12);
    expect(clamp(12, 12, 20)).toBe(12);
    expect(clamp(13, -100, 20)).toBe(13);
  });

  test("clamp min", () => {
    expect(clamp(10, 16, 20)).toBe(16);
    expect(clamp(-1000, 16, 20)).toBe(16);
  });

  test("clamp max", () => {
    expect(clamp(100, 16, 20)).toBe(20);
    expect(clamp(1000, 16, 20)).toBe(20);
  });
});

describe("roundUpToMultiple", () => {
  test("from an off-grid value goes up to the next multiple", () => {
    expect(roundUpToMultiple(1, 25)).toBe(25);
    expect(roundUpToMultiple(24, 25)).toBe(25);
    expect(roundUpToMultiple(30, 25)).toBe(50);
    expect(roundUpToMultiple(7, 5)).toBe(10);
  });

  test("from a multiple advances one full step", () => {
    expect(roundUpToMultiple(0, 25)).toBe(25);
    expect(roundUpToMultiple(25, 25)).toBe(50);
    expect(roundUpToMultiple(50, 25)).toBe(75);
  });

  test("step of 1 increments integers", () => {
    expect(roundUpToMultiple(7, 1)).toBe(8);
    expect(roundUpToMultiple(0, 1)).toBe(1);
  });

  test("negative values", () => {
    expect(roundUpToMultiple(-30, 25)).toBe(-25);
    expect(roundUpToMultiple(-25, 25)).toBe(0);
    expect(roundUpToMultiple(-1, 25)).toBe(0);
  });

  test("non-positive step returns value unchanged", () => {
    expect(roundUpToMultiple(7, 0)).toBe(7);
    expect(roundUpToMultiple(7, -5)).toBe(7);
  });
});

describe("roundDownToMultiple", () => {
  test("from an off-grid value goes down to the previous multiple", () => {
    expect(roundDownToMultiple(30, 25)).toBe(25);
    expect(roundDownToMultiple(49, 25)).toBe(25);
    expect(roundDownToMultiple(24, 25)).toBe(0);
    expect(roundDownToMultiple(7, 5)).toBe(5);
  });

  test("from a multiple retreats one full step", () => {
    expect(roundDownToMultiple(50, 25)).toBe(25);
    expect(roundDownToMultiple(25, 25)).toBe(0);
    expect(roundDownToMultiple(0, 25)).toBe(-25);
  });

  test("step of 1 decrements integers", () => {
    expect(roundDownToMultiple(7, 1)).toBe(6);
    expect(roundDownToMultiple(1, 1)).toBe(0);
  });

  test("negative values", () => {
    expect(roundDownToMultiple(-1, 25)).toBe(-25);
    expect(roundDownToMultiple(-25, 25)).toBe(-50);
  });

  test("non-positive step returns value unchanged", () => {
    expect(roundDownToMultiple(7, 0)).toBe(7);
    expect(roundDownToMultiple(7, -5)).toBe(7);
  });
});

describe("randomBoolean", () => {
  test("produces both outcomes frequently", () => {
    let heads = 0;
    let tails = 0;

    for (let i = 0; i < 1000; i += 1) {
      if (randomBoolean()) {
        heads += 1;
      } else {
        tails += 1;
      }
    }
    expect(heads).toBeGreaterThan(100);
    expect(tails).toBeGreaterThan(100);
  });
});

describe("navigationDelta", () => {
  test("forward keys return 1", () => {
    expect(navigationDelta("d")).toBe(1);
    expect(navigationDelta("D")).toBe(1);
    expect(navigationDelta("ArrowRight")).toBe(1);
  });

  test("backward keys return -1", () => {
    expect(navigationDelta("a")).toBe(-1);
    expect(navigationDelta("A")).toBe(-1);
    expect(navigationDelta("ArrowLeft")).toBe(-1);
  });
});

describe("getNumbersAround", () => {
  test("empty", () => {
    expect(numbersAround(0, 0, 0, 0)).toStrictEqual([]);
  });

  test("one", () => {
    expect(numbersAround(0, 1, 0, 0)).toStrictEqual([0]);
    expect(numbersAround(0, 1, -1, 1)).toStrictEqual([0]);
    expect(numbersAround(1, 1, -1, 1)).toStrictEqual([1]);
    expect(numbersAround(-1, 1, -1, 1)).toStrictEqual([-1]);
  });

  test("two", () => {
    expect(numbersAround(0, 2, -1, 1)).toStrictEqual([-1, 0]);
    expect(numbersAround(0, 2, -2, 2)).toStrictEqual([-1, 0]);
    expect(numbersAround(1, 2, -2, 2)).toStrictEqual([0, 1]);
    expect(numbersAround(-1, 2, -2, 2)).toStrictEqual([-2, -1]);
    expect(numbersAround(-2, 2, -2, 2)).toStrictEqual([-2, -1]);
  });

  test("three", () => {
    expect(numbersAround(0, 3, -1, 1)).toStrictEqual([-1, 0, 1]);
    expect(numbersAround(0, 3, -2, 2)).toStrictEqual([-1, 0, 1]);
  });

  test("many", () => {
    expect(numbersAround(40, 10, 30, 100)).toStrictEqual([40, 39, 41, 38, 42, 37, 43, 36, 44, 35].sort((a, b) => a - b));
  });

  test("count = 0", () => {
    expect(numbersAround(40, 0, 0, 100)).toStrictEqual([]);
    expect(numbersAround(40, 0, 30, 100)).toStrictEqual([]);
  });

  test("mix > max", () => {
    expect(numbersAround(40, 10, 100, 20)).toStrictEqual([]);
  });
});

describe("getNumberRange", () => {
  test("zero", () => {
    expect(numbersInRange(0, 0)).toStrictEqual([0]);
  });

  test("normal", () => {
    expect(numbersInRange(0, 1)).toStrictEqual([0, 1]);
    expect(numbersInRange(0, 0)).toStrictEqual([0]);
    expect(numbersInRange(0, 1)).toStrictEqual([0, 1]);
    expect(numbersInRange(1, 3)).toStrictEqual([1, 2, 3]);
    expect(numbersInRange(5, 7)).toStrictEqual([5, 6, 7]);
    expect(numbersInRange(-2, 2)).toStrictEqual([-2, -1, 0, 1, 2]);
    expect(numbersInRange(3, 3)).toStrictEqual([3]);
    expect(numbersInRange(10, 13)).toStrictEqual([10, 11, 12, 13]);
  });
});
