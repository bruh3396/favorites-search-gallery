import { describe, expect, test } from "vitest";
import { getBitWidth, hashInt, packIntArray, readPackedInt } from "@/core/utils/number/bit";

describe("hashInt", () => {
  test("returns the same hash for the same value and seed", () => {
    expect(hashInt(12_345, 99)).toBe(hashInt(12_345, 99));
  });

  test("returns an unsigned 32-bit integer", () => {
    for (const value of [0, 1, 2 ** 31, (2 ** 32) - 1]) {
      const hash = hashInt(value, 7);

      expect(Number.isInteger(hash) && hash >= 0 && hash < 2 ** 32).toBe(true);
    }
  });

  test("never hashes distinct values to the same hash under one seed", () => {
    const hashes = new Set(Array.from({ length: 10_000 }, (_, value) => hashInt(value, 42)));

    expect(hashes.size).toBe(10_000);
  });

  test("orders the same values differently under a different seed", () => {
    const values = Array.from({ length: 20 }, (_, value) => value);
    const orderBySeed = (seed: number): number[] => values.toSorted((a, b) => hashInt(a, seed) - hashInt(b, seed));

    expect(orderBySeed(1)).not.toEqual(orderBySeed(2));
  });
});

describe("getBitWidth", () => {
  test("returns 0 for a count of 1 or fewer distinct values", () => {
    expect(getBitWidth(0)).toBe(0);
    expect(getBitWidth(1)).toBe(0);
  });

  test("returns the bits needed to index count distinct values", () => {
    expect(getBitWidth(2)).toBe(1);
    expect(getBitWidth(3)).toBe(2);
    expect(getBitWidth(4)).toBe(2);
    expect(getBitWidth(5)).toBe(3);
    expect(getBitWidth(256)).toBe(8);
    expect(getBitWidth(257)).toBe(9);
    expect(getBitWidth(65_536)).toBe(16);
    expect(getBitWidth(65_537)).toBe(17);
  });
});

describe("packIntArray", () => {
  test("round-trips values at a non-byte-aligned width through readPackedInt", () => {
    const values = Uint16Array.from([0, 1, 5, 130_000 & 0x1_ff_ff, 42]);
    const bits = 18;
    const packed = packIntArray(values, values.length, bits);

    for (let i = 0; i < values.length; i += 1) {
      expect(readPackedInt(packed, i, bits)).toBe(values[i]);
    }
  });

  test("round-trips the maximum value at a given width", () => {
    const bits = 17;
    const max = (1 << bits) - 1;
    const values = Uint32Array.from([0, max, 1, max, max - 1]);
    const packed = packIntArray(values, values.length, bits);

    for (let i = 0; i < values.length; i += 1) {
      expect(readPackedInt(packed, i, bits)).toBe(values[i]);
    }
  });

  test("packs to the expected byte length", () => {
    const values = Uint16Array.from([0, 0, 0, 0]);

    expect(packIntArray(values, 4, 18)).toHaveLength(Math.ceil((4 * 18) / 8));
  });

  test("round-trips a single-bit width", () => {
    const values = Uint16Array.from([1, 0, 1, 1, 0, 1]);
    const packed = packIntArray(values, values.length, 1);

    for (let i = 0; i < values.length; i += 1) {
      expect(readPackedInt(packed, i, 1)).toBe(values[i]);
    }
  });

  test("packs only the first length entries", () => {
    const values = Uint16Array.from([7, 3, 9, 999]);
    const packed = packIntArray(values, 2, 4);

    expect(readPackedInt(packed, 0, 4)).toBe(7);
    expect(readPackedInt(packed, 1, 4)).toBe(3);
  });

  test("round-trips a large random sequence across byte boundaries", () => {
    const bits = 20;
    const max = (1 << bits) - 1;
    const values = new Uint32Array(1_000);

    for (let i = 0; i < values.length; i += 1) {
      values[i] = Math.floor(Math.random() * (max + 1));
    }
    const packed = packIntArray(values, values.length, bits);

    for (let i = 0; i < values.length; i += 1) {
      expect(readPackedInt(packed, i, bits)).toBe(values[i]);
    }
  });
});
