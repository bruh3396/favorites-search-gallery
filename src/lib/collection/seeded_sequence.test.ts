import { SeededSequence } from "@/lib/collection/seeded_sequence";

describe("nextInRange", () => {
  test("stays within [min, max)", () => {
    const sequence = new SeededSequence();

    for (let i = 0; i < 100; i += 1) {
      const value = sequence.nextInRange(5, 15);

      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(15);
    }
  });

  test("empty range yields min", () => {
    const sequence = new SeededSequence();

    expect(sequence.nextInRange(7, 7)).toBe(7);
  });

  test("advances the seed between calls", () => {
    const sequence = new SeededSequence();
    const values = new Set(Array.from({ length: 50 }, () => sequence.nextInRange(0, 1_000_000)));

    expect(values.size).toBeGreaterThan(1);
  });

  test("separate instances advance independently", () => {
    const first = new SeededSequence();
    const second = new SeededSequence();

    expect(first.nextInRange(0, 1_000_000)).toBe(second.nextInRange(0, 1_000_000));
  });
});
