import { describe, expect, test } from "vitest";
import { randomBoolean, randomFloatInRange, randomInt, randomIntInRange, seededFloat, shuffleInPlace } from "@/core/utils/random/random_utilities";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";

const randomSource = new MemoryRandomSource([0.7, 0.2, 0.9, 0.4, 0.1, 0.6, 0.3, 0.8, 0.5]);

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

describe("randomFloatInRange", () => {
  test("returns 0 when min and max are 0", () => {
    expect(randomFloatInRange(new MemoryRandomSource([0.5]), 0, 0)).toBe(0);
  });

  test("scales into [min, max)", () => {
    expect(randomFloatInRange(new MemoryRandomSource([0]), 10, 20)).toBe(10);
    expect(randomFloatInRange(new MemoryRandomSource([0.25]), 10, 20)).toBe(12.5);
  });
});

describe("randomBoolean", () => {
  test("splits at one half", () => {
    expect(randomBoolean(new MemoryRandomSource([0.49]))).toBe(true);
    expect(randomBoolean(new MemoryRandomSource([0.5]))).toBe(false);
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

describe("shuffleInPlace", () => {
  const numbers = Array.from({ length: 1_000 }, (_, i) => i + 1);
  const numberSet = new Set(numbers);

  test("leaves an empty array empty", () => {
    expect(shuffleInPlace(randomSource, [])).toStrictEqual([]);
  });

  test("leaves a single element in place", () => {
    expect(shuffleInPlace(randomSource, [1])).toStrictEqual([1]);
  });

  test("reorders many elements without losing any", () => {
    const shuffled = shuffleInPlace(randomSource, [...numbers]);

    expect(shuffled).toHaveLength(numbers.length);
    expect(shuffled).not.toStrictEqual(numbers);

    for (const num of numbers) {
      expect(numberSet.has(num)).toBe(true);
    }
  });
});
