import { describe, expect, test } from "vitest";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";

function bitSetFrom(size: number, positions: number[]): BitSet {
  const set = new BitSet(size);

  positions.forEach(position => set.set(position));
  return set;
}

function positionsOf(set: BitSet): number[] {
  return set.gather(Array.from({ length: set.size }, (_, i) => i));
}

describe("BitSet", () => {
  test("stores and reports membership", () => {
    const set = bitSetFrom(100, [0, 31, 32, 63, 64, 99]);

    [0, 31, 32, 63, 64, 99].forEach(position => expect(set.has(position)).toBe(true));
    [1, 30, 62, 98].forEach(position => expect(set.has(position)).toBe(false));
  });

  test("treats add as idempotent", () => {
    const set = new BitSet(64);

    set.set(10);
    set.set(10);
    expect(set.cardinality()).toBe(1);
    expect(set.has(10)).toBe(true);
  });

  test("keeps bits on either side of a word boundary independent", () => {
    const set = bitSetFrom(64, [31]);

    expect(set.has(31)).toBe(true);
    expect(set.has(32)).toBe(false);
  });

  test("counts population", () => {
    expect(new BitSet(64).cardinality()).toBe(0);
    expect(bitSetFrom(200, [0, 5, 63, 64, 128, 199]).cardinality()).toBe(6);
  });

  describe("mapPositions", () => {
    const source = Array.from({ length: 256 }, (_, i) => `d${i}`);

    test("visits nothing for an empty set", () => {
      expect(positionsOf(new BitSet(64))).toEqual([]);
    });

    test("visits positions ascending within a word", () => {
      expect(positionsOf(bitSetFrom(32, [0, 1, 3, 5, 31]))).toEqual([0, 1, 3, 5, 31]);
    });

    test("visits positions ascending across word boundaries", () => {
      const positions = [0, 31, 32, 33, 63, 64, 127, 200];

      expect(positionsOf(bitSetFrom(256, positions))).toEqual(positions);
    });

    test("maps each set position through the source in ascending order", () => {
      const positions = [0, 31, 32, 33, 63, 64, 127, 200];

      expect(bitSetFrom(256, positions).gather(source)).toEqual(positions.map(p => source[p]));
    });

    test("returns an empty array for an empty set", () => {
      expect(new BitSet(64).gather(source)).toEqual([]);
    });

    test("produces exactly cardinality() elements", () => {
      const set = bitSetFrom(256, [1, 2, 99, 100, 200, 255]);

      expect(set.gather(source).length).toBe(set.cardinality());
    });

    test("agrees with an independent has()-scan mapping", () => {
      const set = bitSetFrom(256, [0, 5, 32, 64, 65, 130, 255]);
      const viaScan: string[] = [];

      for (let position = 0; position < 256; position += 1) {
        if (set.has(position)) {
          viaScan.push(source[position]);
        }
      }
      expect(set.gather(source)).toEqual(viaScan);
    });
  });

  describe("in-place algebra", () => {
    test("orInPlace mutates the receiver and returns it", () => {
      const a = bitSetFrom(128, [1, 64]);

      a.orInPlace(bitSetFrom(128, [2, 65]));

      expect(positionsOf(a)).toEqual([1, 2, 64, 65]);
    });

    test("andInPlaceIsEmpty intersects in place and reports emptiness", () => {
      const a = bitSetFrom(128, [1, 2, 3, 64]);

      expect(a.andInPlace(bitSetFrom(128, [2, 3, 64, 65]))).toBe(false);
      expect(positionsOf(a)).toEqual([2, 3, 64]);
    });

    test("andInPlaceIsEmpty reports empty on disjoint sets", () => {
      const a = bitSetFrom(64, [0, 2, 4]);

      expect(a.andInPlace(bitSetFrom(64, [1, 3, 5]))).toBe(true);
      expect(a.isEmpty()).toBe(true);
    });

    test("andNotInPlaceIsEmpty subtracts in place and reports emptiness", () => {
      const a = bitSetFrom(128, [1, 2, 3, 64]);

      expect(a.andNotInPlace(bitSetFrom(128, [2, 64]))).toBe(false);
      expect(positionsOf(a)).toEqual([1, 3]);
    });

    test("andNotInPlaceIsEmpty reports empty when a superset is subtracted", () => {
      const a = bitSetFrom(64, [1, 2, 3]);

      expect(a.andNotInPlace(bitSetFrom(64, [0, 1, 2, 3, 4]))).toBe(true);
      expect(a.isEmpty()).toBe(true);
    });

    test("orComplementInPlace unions the complement of the argument", () => {
      const a = bitSetFrom(8, [0]);

      a.orComplementInPlace(bitSetFrom(8, [0, 1]));
      expect(positionsOf(a)).toEqual([0, 2, 3, 4, 5, 6, 7]);
    });

    test("throws on a size mismatch", () => {
      expect(() => new BitSet(64).orInPlace(new BitSet(128))).toThrow(/size mismatch/);
    });
  });

  describe("lifecycle", () => {
    test("clone is an independent copy", () => {
      const original = bitSetFrom(128, [1, 64, 100]);
      const copy = original.clone();

      copy.set(2);
      expect(original.has(2)).toBe(false);
      expect(positionsOf(copy)).toEqual([1, 2, 64, 100]);
    });

    test("remove clears a single bit", () => {
      const set = bitSetFrom(128, [1, 2, 64]);

      set.clear(2);
      expect(positionsOf(set)).toEqual([1, 64]);
    });

    test("isEmpty reflects population", () => {
      expect(new BitSet(128).isEmpty()).toBe(true);
      expect(bitSetFrom(128, [100]).isEmpty()).toBe(false);
    });

    test("fill sets exactly the first size positions with no phantom high bits", () => {
      const set = new BitSet(70);

      set.fill();
      expect(set.cardinality()).toBe(70);
      expect(positionsOf(set)).toEqual(Array.from({ length: 70 }, (_, i) => i));
      expect(set.has(69)).toBe(true);
      expect(set.has(70)).toBe(false);
    });

    test("fill on a word-aligned size sets every bit", () => {
      const set = new BitSet(64);

      set.fill();
      expect(set.cardinality()).toBe(64);
      expect(set.has(63)).toBe(true);
    });

    test("fill on an empty bitset stays empty", () => {
      const set = new BitSet(0);

      set.fill();
      expect(set.cardinality()).toBe(0);
    });

    test("retainPositions keeps only the intersecting positions in place", () => {
      const set = bitSetFrom(128, [1, 40, 70, 100]);
      const isEmpty = set.andPositionsInPlace(Int32Array.from([40, 70, 90]));

      expect(isEmpty).toBe(false);
      expect(positionsOf(set)).toEqual([40, 70]);
    });

    test("retainPositions reports empty when nothing intersects", () => {
      const set = bitSetFrom(128, [1, 2, 3]);

      expect(set.andPositionsInPlace(Int32Array.from([50, 60]))).toBe(true);
      expect(set.isEmpty()).toBe(true);
    });

    test("retainPositions on an empty argument clears the set", () => {
      const set = bitSetFrom(128, [1, 2, 3]);

      expect(set.andPositionsInPlace(Int32Array.from([]))).toBe(true);
      expect(set.isEmpty()).toBe(true);
    });
  });
});
