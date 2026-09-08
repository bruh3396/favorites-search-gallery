import { DensePosting, EmptyPosting, Posting, SparsePosting } from "@/lib/search/engine/bitmap/bits/posting";
import { describe, expect, test } from "vitest";
import { BitSet } from "@/lib/search/engine/bitmap/bits/bitset";

const SIZE = 100;

function bitSet(...positions: number[]): BitSet {
  const set = new BitSet(SIZE);

  for (const position of positions) {
    set.add(position);
  }
  return set;
}

function positionsOf(set: BitSet): number[] {
  return set.gather(Array.from({ length: set.size }, (_, i) => i));
}

function dense(...positions: number[]): DensePosting {
  return new DensePosting(bitSet(...positions));
}

function sparse(...positions: number[]): SparsePosting {
  return new SparsePosting(Int32Array.from(positions));
}

const cases: { name: string; make: (...positions: number[]) => Posting }[] = [
  { name: "DensePosting", make: dense },
  { name: "SparsePosting", make: sparse }
];

describe.each(cases)("$name", ({ make }) => {
  test("reports its count", () => {
    expect(make(3, 40, 70).cardinality).toBe(3);
  });

  test("seeds a working set with its positions", () => {
    expect(positionsOf(make(3, 40, 70).toBitSet(SIZE))).toEqual([3, 40, 70]);
  });

  test("andInto intersects the working set and reports emptiness", () => {
    const working = bitSet(3, 40, 70, 90);

    expect(make(40, 70).andInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([40, 70]);
  });

  test("andInto reports empty when the intersection is empty", () => {
    const working = bitSet(1, 2, 3);

    expect(make(50, 60).andInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  test("andNotInto subtracts its positions and reports emptiness", () => {
    const working = bitSet(3, 40, 70);

    expect(make(40).andNotInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([3, 70]);
  });

  test("andNotInto reports empty when it removes everything", () => {
    const working = bitSet(40, 70);

    expect(make(40, 70).andNotInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  test("orInto unions its positions into the accumulator", () => {
    const accumulator = bitSet(1);

    make(40, 70).orInto(accumulator);
    expect(positionsOf(accumulator)).toEqual([1, 40, 70]);
  });

  test("orComplementInto sets every bit except where the accumulator was 0 and it carries the position", () => {
    const accumulator = bitSet(5);

    make(5, 40).orComplementInto(accumulator);
    expect(accumulator.has(40)).toBe(false);
    expect(accumulator.has(5)).toBe(true);
    expect(accumulator.has(0)).toBe(true);
    expect(accumulator.cardinality()).toBe(SIZE - 1);
  });
});

describe("EmptyPosting", () => {
  const empty = new EmptyPosting();

  test("has a count of zero", () => {
    expect(empty.cardinality).toBe(0);
  });

  test("seeds an empty working set", () => {
    expect(empty.toBitSet(SIZE).isEmpty()).toBe(true);
  });

  test("andInto empties the working set and reports empty", () => {
    const working = bitSet(3, 40, 70);

    expect(empty.andInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  test("andNotInto leaves the working set untouched and reports its emptiness", () => {
    const working = bitSet(3, 40);

    expect(empty.andNotInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([3, 40]);
  });

  test("andNotInto reports empty when the working set was already empty", () => {
    expect(empty.andNotInto(new BitSet(SIZE))).toBe(true);
  });

  test("orInto leaves the accumulator untouched", () => {
    const accumulator = bitSet(1, 2);

    empty.orInto(accumulator);
    expect(positionsOf(accumulator)).toEqual([1, 2]);
  });

  test("orComplementInto fills the accumulator, since the complement of nothing is everything", () => {
    const accumulator = bitSet(5);

    empty.orComplementInto(accumulator);
    expect(accumulator.cardinality()).toBe(SIZE);
  });
});

describe("dense and sparse agree", () => {
  test("produce the same andInto result", () => {
    const denseWorking = bitSet(3, 40, 70, 90);
    const sparseWorking = bitSet(3, 40, 70, 90);

    dense(40, 70).andInto(denseWorking);
    sparse(40, 70).andInto(sparseWorking);
    expect(positionsOf(denseWorking)).toEqual(positionsOf(sparseWorking));
  });

  test("produce the same orComplementInto result", () => {
    const denseAcc = bitSet(5, 12);
    const sparseAcc = bitSet(5, 12);

    dense(5, 40, 88).orComplementInto(denseAcc);
    sparse(5, 40, 88).orComplementInto(sparseAcc);
    expect(positionsOf(denseAcc)).toEqual(positionsOf(sparseAcc));
  });
});
