import { describe, expect, it } from "vitest";
import { BitSet } from "@/lib/search/bitmap/bitset";

function bitSetFrom(size: number, positions: number[]): BitSet {
  const set = new BitSet(size);

  positions.forEach(position => set.add(position));
  return set;
}

describe("BitSet", () => {
  it("stores and reports membership", () => {
    const set = bitSetFrom(100, [0, 31, 32, 63, 64, 99]);

    [0, 31, 32, 63, 64, 99].forEach(position => expect(set.has(position)).toBe(true));
    [1, 30, 62, 98].forEach(position => expect(set.has(position)).toBe(false));
  });

  it("treats add as idempotent", () => {
    const set = new BitSet(64);

    set.add(10);
    set.add(10);
    expect(set.count()).toBe(1);
    expect(set.has(10)).toBe(true);
  });

  it("keeps bits on either side of a word boundary independent", () => {
    const set = bitSetFrom(64, [31]);

    expect(set.has(31)).toBe(true);
    expect(set.has(32)).toBe(false);
  });

  it("counts population", () => {
    expect(new BitSet(64).count()).toBe(0);
    expect(bitSetFrom(200, [0, 5, 63, 64, 128, 199]).count()).toBe(6);
  });

  describe("positions", () => {
    it("returns an empty array for an empty set", () => {
      expect(new BitSet(64).positions()).toEqual([]);
    });

    it("returns positions ascending within a word", () => {
      // Regression: the original picked the highest set bit first, so a single
      // word came out descending ([3, 1, 0] instead of [0, 1, 3]).
      expect(bitSetFrom(32, [0, 1, 3, 5, 31]).positions()).toEqual([0, 1, 3, 5, 31]);
    });

    it("returns positions ascending across word boundaries", () => {
      const positions = [0, 31, 32, 33, 63, 64, 127, 200];

      expect(bitSetFrom(256, positions).positions()).toEqual(positions);
    });

    it("agrees with count", () => {
      const set = bitSetFrom(500, [1, 2, 99, 100, 256, 499]);

      expect(set.positions().length).toBe(set.count());
    });
  });

  describe("and", () => {
    it("intersects", () => {
      const a = bitSetFrom(128, [1, 2, 3, 64, 65]);
      const b = bitSetFrom(128, [2, 3, 4, 65, 66]);

      expect(a.and(b).positions()).toEqual([2, 3, 65]);
    });

    it("returns empty on disjoint sets", () => {
      const a = bitSetFrom(64, [0, 2, 4]);
      const b = bitSetFrom(64, [1, 3, 5]);

      expect(a.and(b).count()).toBe(0);
    });

    it("does not mutate operands", () => {
      const a = bitSetFrom(64, [1, 2, 3]);
      const b = bitSetFrom(64, [2, 3, 4]);

      a.and(b);
      expect(a.positions()).toEqual([1, 2, 3]);
      expect(b.positions()).toEqual([2, 3, 4]);
    });
  });

  describe("or", () => {
    it("unions", () => {
      const a = bitSetFrom(128, [1, 2, 64]);
      const b = bitSetFrom(128, [2, 3, 65]);

      expect(a.or(b).positions()).toEqual([1, 2, 3, 64, 65]);
    });

    it("does not mutate operands", () => {
      const a = bitSetFrom(64, [1]);
      const b = bitSetFrom(64, [2]);

      a.or(b);
      expect(a.positions()).toEqual([1]);
      expect(b.positions()).toEqual([2]);
    });
  });

  describe("andNot", () => {
    it("subtracts", () => {
      const a = bitSetFrom(128, [1, 2, 3, 64, 65]);
      const b = bitSetFrom(128, [2, 64]);

      expect(a.andNot(b).positions()).toEqual([1, 3, 65]);
    });

    it("subtracting a superset yields empty", () => {
      const a = bitSetFrom(64, [1, 2, 3]);
      const b = bitSetFrom(64, [0, 1, 2, 3, 4]);

      expect(a.andNot(b).count()).toBe(0);
    });

    it("does not mutate operands", () => {
      const a = bitSetFrom(64, [1, 2, 3]);
      const b = bitSetFrom(64, [2]);

      a.andNot(b);
      expect(a.positions()).toEqual([1, 2, 3]);
      expect(b.positions()).toEqual([2]);
    });
  });

  describe("in-place algebra", () => {
    it("andInPlace mutates the receiver and returns it", () => {
      const a = bitSetFrom(128, [1, 2, 3, 64]);
      const result = a.andInPlace(bitSetFrom(128, [2, 3, 64, 65]));

      expect(result).toBe(a);
      expect(a.positions()).toEqual([2, 3, 64]);
    });

    it("orInPlace mutates the receiver and returns it", () => {
      const a = bitSetFrom(128, [1, 64]);
      const result = a.orInPlace(bitSetFrom(128, [2, 65]));

      expect(result).toBe(a);
      expect(a.positions()).toEqual([1, 2, 64, 65]);
    });

    it("andNotInPlace mutates the receiver and returns it", () => {
      const a = bitSetFrom(128, [1, 2, 3, 64]);
      const result = a.andNotInPlace(bitSetFrom(128, [2, 64]));

      expect(result).toBe(a);
      expect(a.positions()).toEqual([1, 3]);
    });

    it("folds an AND-chain into one accumulator", () => {
      const terms = [
        bitSetFrom(128, [1, 2, 3, 4, 64]),
        bitSetFrom(128, [2, 3, 4, 64]),
        bitSetFrom(128, [3, 4, 64])
      ];
      const accumulator = terms[0].clone();

      terms.slice(1).forEach(term => accumulator.andInPlace(term));
      expect(accumulator.positions()).toEqual([3, 4, 64]);
      expect(terms[0].positions()).toEqual([1, 2, 3, 4, 64]);
    });

    it("throws on a size mismatch", () => {
      expect(() => new BitSet(64).andInPlace(new BitSet(128))).toThrow(/size mismatch/);
    });
  });

  describe("lifecycle", () => {
    it("clone is an independent copy", () => {
      const original = bitSetFrom(128, [1, 64, 100]);
      const copy = original.clone();

      copy.add(2);
      expect(original.has(2)).toBe(false);
      expect(copy.positions()).toEqual([1, 2, 64, 100]);
    });

    it("clear empties the set", () => {
      const set = bitSetFrom(128, [1, 64, 100]);

      set.clear();
      expect(set.count()).toBe(0);
      expect(set.isEmpty()).toBe(true);
    });

    it("remove clears a single bit", () => {
      const set = bitSetFrom(128, [1, 2, 64]);

      set.remove(2);
      expect(set.positions()).toEqual([1, 64]);
    });

    it("isEmpty reflects population", () => {
      expect(new BitSet(128).isEmpty()).toBe(true);
      expect(bitSetFrom(128, [100]).isEmpty()).toBe(false);
    });

    it("fill sets exactly the first size positions with no phantom high bits", () => {
      const set = new BitSet(70);

      set.fill();
      expect(set.count()).toBe(70);
      expect(set.positions()).toEqual(Array.from({ length: 70 }, (_, i) => i));
      expect(set.has(69)).toBe(true);
      expect(set.has(70)).toBe(false);
    });

    it("fill on a word-aligned size sets every bit", () => {
      const set = new BitSet(64);

      set.fill();
      expect(set.count()).toBe(64);
      expect(set.has(63)).toBe(true);
    });

    it("fill on an empty bitset stays empty", () => {
      const set = new BitSet(0);

      set.fill();
      expect(set.count()).toBe(0);
    });

    it("retainPositions keeps only the intersecting positions in place", () => {
      const set = bitSetFrom(128, [1, 40, 70, 100]);
      const empty = set.retainPositions(Int32Array.from([40, 70, 90]));

      expect(empty).toBe(false);
      expect(set.positions()).toEqual([40, 70]);
    });

    it("retainPositions reports empty when nothing intersects", () => {
      const set = bitSetFrom(128, [1, 2, 3]);

      expect(set.retainPositions(Int32Array.from([50, 60]))).toBe(true);
      expect(set.isEmpty()).toBe(true);
    });

    it("retainPositions on an empty argument clears the set", () => {
      const set = bitSetFrom(128, [1, 2, 3]);

      expect(set.retainPositions(Int32Array.from([]))).toBe(true);
      expect(set.isEmpty()).toBe(true);
    });
  });
});
