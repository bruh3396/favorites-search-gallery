import { bitWidth, packIntArray, readPackedInt } from "@/utils/pure/bit";
import { describe, expect, test } from "vitest";

describe("bits", () => {
  describe("bitWidth", () => {
    test("returns 0 for a count of 1 or fewer distinct values", () => {
      expect(bitWidth(0)).toBe(0);
      expect(bitWidth(1)).toBe(0);
    });

    test("returns the bits needed to index count distinct values", () => {
      expect(bitWidth(2)).toBe(1);
      expect(bitWidth(3)).toBe(2);
      expect(bitWidth(4)).toBe(2);
      expect(bitWidth(5)).toBe(3);
      expect(bitWidth(256)).toBe(8);
      expect(bitWidth(257)).toBe(9);
      expect(bitWidth(65536)).toBe(16);
      expect(bitWidth(65537)).toBe(17);
    });
  });

  describe("packIntArray / readPackedInt", () => {
    test("round-trips values at a non-byte-aligned width", () => {
      const values = Uint16Array.from([0, 1, 5, 130000 & 0x1ffff, 42]);
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
      const values = new Uint32Array(1000);

      for (let i = 0; i < values.length; i += 1) {
        values[i] = Math.floor(Math.random() * (max + 1));
      }
      const packed = packIntArray(values, values.length, bits);

      for (let i = 0; i < values.length; i += 1) {
        expect(readPackedInt(packed, i, bits)).toBe(values[i]);
      }
    });
  });
});
