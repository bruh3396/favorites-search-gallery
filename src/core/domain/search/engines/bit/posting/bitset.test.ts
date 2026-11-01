import { describe, expect, test } from "vitest";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";

function createBitSet(size: number, positions: number[]): BitSet {
  const bitSet = new BitSet(size);

  positions.forEach(position => bitSet.set(position));
  return bitSet;
}

function gatherPositions(bitSet: BitSet): number[] {
  return bitSet.gather(Array.from({ length: bitSet.size }, (_, i) => i));
}

describe("BitSet", () => {
  test("stores and reports membership", () => {
    const bitSet = createBitSet(100, [0, 31, 32, 63, 64, 99]);

    [0, 31, 32, 63, 64, 99].forEach(position => expect(bitSet.has(position)).toBe(true));
    [1, 30, 62, 98].forEach(position => expect(bitSet.has(position)).toBe(false));
  });

  test("treats add as idempotent", () => {
    const bitSet = new BitSet(64);

    bitSet.set(10);
    bitSet.set(10);
    expect(bitSet.cardinality()).toBe(1);
    expect(bitSet.has(10)).toBe(true);
  });

  test("keeps bits on either side of a word boundary independent", () => {
    const bitSet = createBitSet(64, [31]);

    expect(bitSet.has(31)).toBe(true);
    expect(bitSet.has(32)).toBe(false);
  });

  test("counts population", () => {
    expect(new BitSet(64).cardinality()).toBe(0);
    expect(createBitSet(200, [0, 5, 63, 64, 128, 199]).cardinality()).toBe(6);
  });

  describe("mapPositions", () => {
    const source = Array.from({ length: 256 }, (_, i) => `d${i}`);

    test("visits nothing for an empty set", () => {
      expect(gatherPositions(new BitSet(64))).toEqual([]);
    });

    test("visits positions ascending within a word", () => {
      expect(gatherPositions(createBitSet(32, [0, 1, 3, 5, 31]))).toEqual([0, 1, 3, 5, 31]);
    });

    test("visits positions ascending across word boundaries", () => {
      const positions = [0, 31, 32, 33, 63, 64, 127, 200];

      expect(gatherPositions(createBitSet(256, positions))).toEqual(positions);
    });

    test("maps each set position through the source in ascending order", () => {
      const positions = [0, 31, 32, 33, 63, 64, 127, 200];

      expect(createBitSet(256, positions).gather(source)).toEqual(positions.map(p => source[p]));
    });

    test("returns an empty array for an empty set", () => {
      expect(new BitSet(64).gather(source)).toEqual([]);
    });

    test("produces exactly cardinality() elements", () => {
      const bitSet = createBitSet(256, [1, 2, 99, 100, 200, 255]);

      expect(bitSet.gather(source).length).toBe(bitSet.cardinality());
    });

    test("agrees with an independent has()-scan mapping", () => {
      const bitSet = createBitSet(256, [0, 5, 32, 64, 65, 130, 255]);
      const viaScan: string[] = [];

      for (let position = 0; position < 256; position += 1) {
        if (bitSet.has(position)) {
          viaScan.push(source[position]);
        }
      }
      expect(bitSet.gather(source)).toEqual(viaScan);
    });
  });

  describe("orInPlace", () => {
    test("unions the argument into the receiver", () => {
      const bitSet = createBitSet(128, [1, 64]);

      bitSet.orInPlace(createBitSet(128, [2, 65]));

      expect(gatherPositions(bitSet)).toEqual([1, 2, 64, 65]);
    });

    test("throws on a size mismatch", () => {
      expect(() => new BitSet(64).orInPlace(new BitSet(128))).toThrow(/size mismatch/);
    });
  });

  describe("andInPlace", () => {
    test("intersects in place and reports emptiness", () => {
      const bitSet = createBitSet(128, [1, 2, 3, 64]);

      expect(bitSet.andInPlace(createBitSet(128, [2, 3, 64, 65]))).toBe(false);
      expect(gatherPositions(bitSet)).toEqual([2, 3, 64]);
    });

    test("reports empty on disjoint sets", () => {
      const bitSet = createBitSet(64, [0, 2, 4]);

      expect(bitSet.andInPlace(createBitSet(64, [1, 3, 5]))).toBe(true);
      expect(bitSet.isEmpty()).toBe(true);
    });
  });

  describe("andNotInPlace", () => {
    test("subtracts in place and reports emptiness", () => {
      const bitSet = createBitSet(128, [1, 2, 3, 64]);

      expect(bitSet.andNotInPlace(createBitSet(128, [2, 64]))).toBe(false);
      expect(gatherPositions(bitSet)).toEqual([1, 3]);
    });

    test("reports empty when a superset is subtracted", () => {
      const bitSet = createBitSet(64, [1, 2, 3]);

      expect(bitSet.andNotInPlace(createBitSet(64, [0, 1, 2, 3, 4]))).toBe(true);
      expect(bitSet.isEmpty()).toBe(true);
    });
  });

  describe("orComplementInPlace", () => {
    test("unions the complement of the argument", () => {
      const bitSet = createBitSet(8, [0]);

      bitSet.orComplementInPlace(createBitSet(8, [0, 1]));
      expect(gatherPositions(bitSet)).toEqual([0, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe("clone", () => {
    test("makes an independent copy", () => {
      const originalBitSet = createBitSet(128, [1, 64, 100]);
      const clonedBitSet = originalBitSet.clone();

      clonedBitSet.set(2);
      expect(originalBitSet.has(2)).toBe(false);
      expect(gatherPositions(clonedBitSet)).toEqual([1, 2, 64, 100]);
    });
  });

  describe("clear", () => {
    test("clears a single bit", () => {
      const bitSet = createBitSet(128, [1, 2, 64]);

      bitSet.clear(2);
      expect(gatherPositions(bitSet)).toEqual([1, 64]);
    });
  });

  describe("isEmpty", () => {
    test("reflects population", () => {
      expect(new BitSet(128).isEmpty()).toBe(true);
      expect(createBitSet(128, [100]).isEmpty()).toBe(false);
    });
  });

  describe("fill", () => {
    test("sets exactly the first size positions with no phantom high bits", () => {
      const bitSet = new BitSet(70);

      bitSet.fill();
      expect(bitSet.cardinality()).toBe(70);
      expect(gatherPositions(bitSet)).toEqual(Array.from({ length: 70 }, (_, i) => i));
      expect(bitSet.has(69)).toBe(true);
      expect(bitSet.has(70)).toBe(false);
    });

    test("sets every bit of a word-aligned size", () => {
      const bitSet = new BitSet(64);

      bitSet.fill();
      expect(bitSet.cardinality()).toBe(64);
      expect(bitSet.has(63)).toBe(true);
    });

    test("leaves an empty bitset empty", () => {
      const bitSet = new BitSet(0);

      bitSet.fill();
      expect(bitSet.cardinality()).toBe(0);
    });
  });

  describe("andPositionsInPlace", () => {
    test("keeps only the intersecting positions in place", () => {
      const bitSet = createBitSet(128, [1, 40, 70, 100]);
      const isEmpty = bitSet.andPositionsInPlace(Uint32Array.from([40, 70, 90]));

      expect(isEmpty).toBe(false);
      expect(gatherPositions(bitSet)).toEqual([40, 70]);
    });

    test("reports empty when nothing intersects", () => {
      const bitSet = createBitSet(128, [1, 2, 3]);

      expect(bitSet.andPositionsInPlace(Uint32Array.from([50, 60]))).toBe(true);
      expect(bitSet.isEmpty()).toBe(true);
    });

    test("clears the set for an empty argument", () => {
      const bitSet = createBitSet(128, [1, 2, 3]);

      expect(bitSet.andPositionsInPlace(Uint32Array.from([]))).toBe(true);
      expect(bitSet.isEmpty()).toBe(true);
    });
  });
});
