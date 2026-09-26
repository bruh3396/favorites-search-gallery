import { DensePosting, EMPTY_POSTING, Posting, SparsePosting } from "@/lib/search/engines/bit/postings/posting";
import { describe, expect, test } from "vitest";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";

const SIZE = 100;

function createBitSet(...positions: number[]): BitSet {
  const set = new BitSet(SIZE);

  for (const position of positions) {
    set.set(position);
  }
  return set;
}

function positionsOf(set: BitSet): number[] {
  return set.gather(Array.from({ length: set.size }, (_, i) => i));
}

function createDensePosting(...positions: number[]): DensePosting {
  return new DensePosting(createBitSet(...positions));
}

function createSparsePosting(...positions: number[]): SparsePosting {
  return new SparsePosting(Uint32Array.from(positions));
}

const cases: { name: string; make: (...positions: number[]) => Posting }[] = [
  { name: "DensePosting", make: createDensePosting },
  { name: "SparsePosting", make: createSparsePosting }
];

describe.each(cases)("$name", ({ make }) => {
  test("reports its count", () => {
    expect(make(3, 40, 70).cardinality).toBe(3);
  });

  test("seeds a working set with its positions", () => {
    expect(positionsOf(make(3, 40, 70).toBitSet(SIZE))).toEqual([3, 40, 70]);
  });

  test("andInto intersects the working set and reports emptiness", () => {
    const working = createBitSet(3, 40, 70, 90);

    expect(make(40, 70).andInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([40, 70]);
  });

  test("andInto reports empty when the intersection is empty", () => {
    const working = createBitSet(1, 2, 3);

    expect(make(50, 60).andInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  test("andNotInto subtracts its positions and reports emptiness", () => {
    const working = createBitSet(3, 40, 70);

    expect(make(40).andNotInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([3, 70]);
  });

  test("andNotInto reports empty when it removes everything", () => {
    const working = createBitSet(40, 70);

    expect(make(40, 70).andNotInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  test("orInto unions its positions into the accumulator", () => {
    const accumulator = createBitSet(1);

    make(40, 70).orInto(accumulator);
    expect(positionsOf(accumulator)).toEqual([1, 40, 70]);
  });

  test("orComplementInto sets every bit except where the accumulator was 0 and it carries the position", () => {
    const accumulator = createBitSet(5);

    make(5, 40).orComplementInto(accumulator);
    expect(accumulator.has(40)).toBe(false);
    expect(accumulator.has(5)).toBe(true);
    expect(accumulator.has(0)).toBe(true);
    expect(accumulator.cardinality()).toBe(SIZE - 1);
  });
});

describe("EmptyPosting", () => {
  const empty = EMPTY_POSTING;

  test("has a count of zero", () => {
    expect(empty.cardinality).toBe(0);
  });

  test("seeds an empty working set", () => {
    expect(empty.toBitSet(SIZE).isEmpty()).toBe(true);
  });

  test("andInto empties the working set and reports empty", () => {
    const working = createBitSet(3, 40, 70);

    expect(empty.andInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  test("andNotInto leaves the working set untouched and reports its emptiness", () => {
    const working = createBitSet(3, 40);

    expect(empty.andNotInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([3, 40]);
  });

  test("andNotInto reports empty when the working set was already empty", () => {
    expect(empty.andNotInto(new BitSet(SIZE))).toBe(true);
  });

  test("orInto leaves the accumulator untouched", () => {
    const accumulator = createBitSet(1, 2);

    empty.orInto(accumulator);
    expect(positionsOf(accumulator)).toEqual([1, 2]);
  });

  test("orComplementInto fills the accumulator, since the complement of nothing is everything", () => {
    const accumulator = createBitSet(5);

    empty.orComplementInto(accumulator);
    expect(accumulator.cardinality()).toBe(SIZE);
  });
});

describe("dense and sparse agree", () => {
  test("produce the same andInto result", () => {
    const denseWorking = createBitSet(3, 40, 70, 90);
    const sparseWorking = createBitSet(3, 40, 70, 90);

    createDensePosting(40, 70).andInto(denseWorking);
    createSparsePosting(40, 70).andInto(sparseWorking);
    expect(positionsOf(denseWorking)).toEqual(positionsOf(sparseWorking));
  });

  test("produce the same orComplementInto result", () => {
    const denseAcc = createBitSet(5, 12);
    const sparseAcc = createBitSet(5, 12);

    createDensePosting(5, 40, 88).orComplementInto(denseAcc);
    createSparsePosting(5, 40, 88).orComplementInto(sparseAcc);
    expect(positionsOf(denseAcc)).toEqual(positionsOf(sparseAcc));
  });
});
