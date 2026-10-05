import {
  average,
  clamp,
  daysToMilliseconds,
  numbersAround,
  numbersInRange,
  randomBoolean,
  randomFloatInRange,
  randomInt,
  randomIntInRange,
  rescale,
  rescaleGeometric,
  roundDownToMultiple,
  roundToTwoDecimalPlaces,
  roundUpToMultiple,
  seededFloat,
  sum,
  toSeconds
} from "@/core/utils/number/number";
import { describe, expect, test } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";

describe("randomInt", () => {
  test("returns 0 for a max of 0", () => {
    expect(randomInt(new MemoryRandomSource([0.5]), 0)).toBe(0);
  });

  test("spans [0, max)", () => {
    expect(randomInt(new MemoryRandomSource([0]), 2_000)).toBe(0);
    expect(randomInt(new MemoryRandomSource([0.5]), 2_000)).toBe(1_000);
    expect(randomInt(new MemoryRandomSource([0.9999]), 2_000)).toBe(1_999);
  });
});

describe("rescale", () => {
  test("rescales a positive range", () => {
    expect(rescale(5, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(50);
    expect(rescale(0, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(0);
    expect(rescale(10, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(100);
    expect(rescale(2.5, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(25);
  });

  test("rescales a negative range", () => {
    expect(rescale(-5, { min: -10, max: 0 }, { min: 0, max: 100 })).toBe(50);
    expect(rescale(-10, { min: -10, max: 0 }, { min: 0, max: 100 })).toBe(0);
    expect(rescale(0, { min: -10, max: 0 }, { min: 0, max: 100 })).toBe(100);
  });

  test("rescales into an inverted range", () => {
    expect(rescale(0, { min: 0, max: 10 }, { min: 100, max: 0 })).toBe(100);
    expect(rescale(10, { min: 0, max: 10 }, { min: 100, max: 0 })).toBe(0);
    expect(rescale(5, { min: 0, max: 10 }, { min: 100, max: 0 })).toBe(50);
  });
});

describe("rescaleGeometric", () => {
  test("hits both endpoints exactly", () => {
    expect(rescaleGeometric(1, { min: 1, max: 10 }, { min: 96, max: 960 })).toBe(96);
    expect(rescaleGeometric(10, { min: 1, max: 10 }, { min: 96, max: 960 })).toBe(960);
  });

  test("multiplies each step by a constant ratio", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(h => rescaleGeometric(h, { min: 1, max: 10 }, { min: 96, max: 960 }));
    const ratios = values.slice(1).map((v, i) => v / values[i]);

    for (const ratio of ratios) {
      expect(ratio).toBeCloseTo(1.291, 1);
    }
  });

  test("maps the midpoint to the geometric mean, not the arithmetic mean", () => {
    expect(rescaleGeometric(5.5, { min: 1, max: 10 }, { min: 96, max: 960 })).toBeCloseTo(304, -1);
  });

  test("produces powers of two", () => {
    expect(rescaleGeometric(0, { min: 0, max: 4 }, { min: 1, max: 16 })).toBe(1);
    expect(rescaleGeometric(1, { min: 0, max: 4 }, { min: 1, max: 16 })).toBe(2);
    expect(rescaleGeometric(2, { min: 0, max: 4 }, { min: 1, max: 16 })).toBe(4);
    expect(rescaleGeometric(3, { min: 0, max: 4 }, { min: 1, max: 16 })).toBe(8);
    expect(rescaleGeometric(4, { min: 0, max: 4 }, { min: 1, max: 16 })).toBe(16);
  });
});

describe("randomIntInRange", () => {
  test("returns 0 when min and max are 0", () => {
    expect(randomIntInRange(new MemoryRandomSource([0.5]), 0, 0)).toBe(0);
  });

  test("spans [min, max)", () => {
    expect(randomIntInRange(new MemoryRandomSource([0]), 10, 20)).toBe(10);
    expect(randomIntInRange(new MemoryRandomSource([0.5]), 10, 20)).toBe(15);
    expect(randomIntInRange(new MemoryRandomSource([0.9999]), 10, 20)).toBe(19);
  });
});

describe("seededFloat", () => {
  test("returns the same float for a seed and a different float for the next seed", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(seededFloat(i)).toBe(seededFloat(i));
      expect(seededFloat(i)).not.toBe(seededFloat(i + 1));
    }
  });
});

describe("daysToMilliseconds", () => {
  test("converts zero days", () => {
    expect(daysToMilliseconds(0)).toBe(0);
  });

  test("converts whole days", () => {
    expect(daysToMilliseconds(1)).toBe(86_400_000);
    expect(daysToMilliseconds(7)).toBe(604_800_000);
  });

  test("converts fractional days", () => {
    expect(daysToMilliseconds(0.5)).toBe(43_200_000);
  });
});

describe("roundToTwoDecimalPlaces", () => {
  test("keeps zero", () => {
    expect(roundToTwoDecimalPlaces(0)).toBe(0);
  });

  test("keeps integers", () => {
    expect(roundToTwoDecimalPlaces(1)).toBe(1);
    expect(roundToTwoDecimalPlaces(-1)).toBe(-1);
  });

  test("rounds positive decimals", () => {
    expect(roundToTwoDecimalPlaces(0.123456)).toBe(0.12);
    expect(roundToTwoDecimalPlaces(0.123456789)).toBe(0.12);
    expect(roundToTwoDecimalPlaces(0.1234)).toBe(0.12);
    expect(roundToTwoDecimalPlaces(0.123)).toBe(0.12);
  });

  test("rounds negative decimals", () => {
    expect(roundToTwoDecimalPlaces(-0.123456)).toBe(-0.12);
    expect(roundToTwoDecimalPlaces(-0.123456789)).toBe(-0.12);
    expect(roundToTwoDecimalPlaces(-0.1234)).toBe(-0.12);
    expect(roundToTwoDecimalPlaces(-0.123)).toBe(-0.12);
  });

  test("rounds large positive numbers", () => {
    expect(roundToTwoDecimalPlaces(123_456_789)).toBe(123_456_789);
    expect(roundToTwoDecimalPlaces(123_456_789.123456)).toBe(123_456_789.12);
    expect(roundToTwoDecimalPlaces(123_456_789.1234)).toBe(123_456_789.12);
    expect(roundToTwoDecimalPlaces(123_456_789.123)).toBe(123_456_789.12);
  });

  test("rounds large negative numbers", () => {
    expect(roundToTwoDecimalPlaces(-123_456_789)).toBe(-123_456_789);
    expect(roundToTwoDecimalPlaces(-123_456_789.123456)).toBe(-123_456_789.12);
    expect(roundToTwoDecimalPlaces(-123_456_789.1234)).toBe(-123_456_789.12);
    expect(roundToTwoDecimalPlaces(-123_456_789.123)).toBe(-123_456_789.12);
  });
});

describe("toSeconds", () => {
  test("converts zero", () => {
    expect(toSeconds(0)).toBe(0);
  });

  test("converts milliseconds to seconds", () => {
    expect(toSeconds(1_000)).toBe(1);
    expect(toSeconds(2_000)).toBe(2);
    expect(toSeconds(5_000)).toBe(5);
    expect(toSeconds(500)).toBe(0.5);
    expect(toSeconds(123_456)).toBe(123.46);
  });

  test("rounds to two decimal places", () => {
    expect(toSeconds(123.456)).toBe(0.12);
    expect(toSeconds(1_234.567)).toBe(1.23);
  });
});

describe("randomFloatInRange", () => {
  test("returns 0 when min and max are 0", () => {
    expect(randomFloatInRange(new MemoryRandomSource([0.5]), 0, 0)).toBe(0);
  });

  test("scales into [min, max)", () => {
    expect(randomFloatInRange(new MemoryRandomSource([0]), 10, 20)).toBe(10);
    expect(randomFloatInRange(new MemoryRandomSource([0.25]), 10, 20)).toBe(12.5);
  });
});

describe("sum", () => {
  test("returns 0 for an empty array", () => {
    expect(sum([])).toBe(0);
  });

  test("returns a single value", () => {
    expect(sum([5])).toBe(5);
    expect(sum([-5])).toBe(-5);
  });

  test("adds multiple values", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([1, -2, 3])).toBe(2);
    expect(sum([-1, -2, -3])).toBe(-6);
  });

  test("adds decimals", () => {
    expect(sum([0.1, 0.2])).toBeCloseTo(0.3);
  });
});

describe("average", () => {
  test("returns 0 for an empty array", () => {
    expect(average([])).toBe(0);
  });

  test("returns a single value", () => {
    expect(average([4])).toBe(4);
    expect(average([-4])).toBe(-4);
  });

  test("averages multiple values", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(average([0, 10])).toBe(5);
    expect(average([-10, 10])).toBe(0);
  });

  test("averages to decimals", () => {
    expect(average([1, 2])).toBe(1.5);
    expect(average([1, 1, 2])).toBeCloseTo(1.333);
  });
});

describe("clamp", () => {
  test("returns 0 for a zero range", () => {
    expect(clamp(0, 0, 0)).toBe(0);
    expect(clamp(1, 0, 0)).toBe(0);
    expect(clamp(10, 0, 0)).toBe(0);
  });

  test("returns min for an inverted range", () => {
    expect(clamp(10, 100, 0)).toBe(100);
  });

  test("keeps a value inside the range", () => {
    expect(clamp(10, 0, 20)).toBe(10);
    expect(clamp(11, 0, 20)).toBe(11);
    expect(clamp(12, 0, 20)).toBe(12);
    expect(clamp(12, 12, 20)).toBe(12);
    expect(clamp(13, -100, 20)).toBe(13);
  });

  test("raises a value below min", () => {
    expect(clamp(10, 16, 20)).toBe(16);
    expect(clamp(-1_000, 16, 20)).toBe(16);
  });

  test("lowers a value above max", () => {
    expect(clamp(100, 16, 20)).toBe(20);
    expect(clamp(1_000, 16, 20)).toBe(20);
  });
});

describe("roundUpToMultiple", () => {
  test("rounds an off-grid value up to the next multiple", () => {
    expect(roundUpToMultiple(1, 25)).toBe(25);
    expect(roundUpToMultiple(24, 25)).toBe(25);
    expect(roundUpToMultiple(30, 25)).toBe(50);
    expect(roundUpToMultiple(7, 5)).toBe(10);
  });

  test("advances a multiple by one full step", () => {
    expect(roundUpToMultiple(0, 25)).toBe(25);
    expect(roundUpToMultiple(25, 25)).toBe(50);
    expect(roundUpToMultiple(50, 25)).toBe(75);
  });

  test("increments integers for a step of 1", () => {
    expect(roundUpToMultiple(7, 1)).toBe(8);
    expect(roundUpToMultiple(0, 1)).toBe(1);
  });

  test("rounds negative values up", () => {
    expect(roundUpToMultiple(-30, 25)).toBe(-25);
    expect(roundUpToMultiple(-25, 25)).toBe(0);
    expect(roundUpToMultiple(-1, 25)).toBe(0);
  });

  test("returns the value unchanged for a non-positive step", () => {
    expect(roundUpToMultiple(7, 0)).toBe(7);
    expect(roundUpToMultiple(7, -5)).toBe(7);
  });
});

describe("roundDownToMultiple", () => {
  test("rounds an off-grid value down to the previous multiple", () => {
    expect(roundDownToMultiple(30, 25)).toBe(25);
    expect(roundDownToMultiple(49, 25)).toBe(25);
    expect(roundDownToMultiple(24, 25)).toBe(0);
    expect(roundDownToMultiple(7, 5)).toBe(5);
  });

  test("retreats a multiple by one full step", () => {
    expect(roundDownToMultiple(50, 25)).toBe(25);
    expect(roundDownToMultiple(25, 25)).toBe(0);
    expect(roundDownToMultiple(0, 25)).toBe(-25);
  });

  test("decrements integers for a step of 1", () => {
    expect(roundDownToMultiple(7, 1)).toBe(6);
    expect(roundDownToMultiple(1, 1)).toBe(0);
  });

  test("rounds negative values down", () => {
    expect(roundDownToMultiple(-1, 25)).toBe(-25);
    expect(roundDownToMultiple(-25, 25)).toBe(-50);
  });

  test("returns the value unchanged for a non-positive step", () => {
    expect(roundDownToMultiple(7, 0)).toBe(7);
    expect(roundDownToMultiple(7, -5)).toBe(7);
  });
});

describe("randomBoolean", () => {
  test("splits at one half", () => {
    expect(randomBoolean(new MemoryRandomSource([0.49]))).toBe(true);
    expect(randomBoolean(new MemoryRandomSource([0.5]))).toBe(false);
  });
});

describe("numbersAround", () => {
  test("returns nothing for a count of 0 in an empty range", () => {
    expect(numbersAround(0, 0, { min: 0, max: 0 })).toStrictEqual([]);
  });

  test("returns the center for a count of 1", () => {
    expect(numbersAround(0, 1, { min: 0, max: 0 })).toStrictEqual([0]);
    expect(numbersAround(0, 1, { min: -1, max: 1 })).toStrictEqual([0]);
    expect(numbersAround(1, 1, { min: -1, max: 1 })).toStrictEqual([1]);
    expect(numbersAround(-1, 1, { min: -1, max: 1 })).toStrictEqual([-1]);
  });

  test("returns two numbers, preferring below the center", () => {
    expect(numbersAround(0, 2, { min: -1, max: 1 })).toStrictEqual([-1, 0]);
    expect(numbersAround(0, 2, { min: -2, max: 2 })).toStrictEqual([-1, 0]);
    expect(numbersAround(1, 2, { min: -2, max: 2 })).toStrictEqual([0, 1]);
    expect(numbersAround(-1, 2, { min: -2, max: 2 })).toStrictEqual([-2, -1]);
    expect(numbersAround(-2, 2, { min: -2, max: 2 })).toStrictEqual([-2, -1]);
  });

  test("returns the center and both neighbors for a count of 3", () => {
    expect(numbersAround(0, 3, { min: -1, max: 1 })).toStrictEqual([-1, 0, 1]);
    expect(numbersAround(0, 3, { min: -2, max: 2 })).toStrictEqual([-1, 0, 1]);
  });

  test("returns many numbers around the center in order", () => {
    expect(numbersAround(40, 10, { min: 30, max: 100 })).toStrictEqual([40, 39, 41, 38, 42, 37, 43, 36, 44, 35].sort((a, b) => a - b));
  });

  test("returns nothing for a count of 0", () => {
    expect(numbersAround(40, 0, { min: 0, max: 100 })).toStrictEqual([]);
    expect(numbersAround(40, 0, { min: 30, max: 100 })).toStrictEqual([]);
  });

  test("returns nothing when min exceeds max", () => {
    expect(numbersAround(40, 10, { min: 100, max: 20 })).toStrictEqual([]);
  });
});

describe("numbersInRange", () => {
  test("returns one number for an equal start and end", () => {
    expect(numbersInRange(0, 0)).toStrictEqual([0]);
  });

  test("lists every number from start to end inclusive", () => {
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
