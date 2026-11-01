import { DensePosting, EMPTY_POSTING, Posting, SparsePosting } from "@/core/domain/search/engines/bit/posting/posting";
import { describe, expect, test } from "vitest";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";

const SIZE = 100;

function createBitSet(...positions: number[]): BitSet {
  const bitSet = new BitSet(SIZE);

  for (const position of positions) {
    bitSet.set(position);
  }
  return bitSet;
}

function gatherPositions(bitSet: BitSet): number[] {
  return bitSet.gather(Array.from({ length: bitSet.size }, (_, i) => i));
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
    expect(gatherPositions(make(3, 40, 70).toBitSet(SIZE))).toEqual([3, 40, 70]);
  });

  test("intersects the working set through andInto and reports emptiness", () => {
    const workingBitSet = createBitSet(3, 40, 70, 90);

    expect(make(40, 70).andInto(workingBitSet)).toBe(false);
    expect(gatherPositions(workingBitSet)).toEqual([40, 70]);
  });

  test("reports empty through andInto when the intersection is empty", () => {
    const workingBitSet = createBitSet(1, 2, 3);

    expect(make(50, 60).andInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("subtracts its positions through andNotInto and reports emptiness", () => {
    const workingBitSet = createBitSet(3, 40, 70);

    expect(make(40).andNotInto(workingBitSet)).toBe(false);
    expect(gatherPositions(workingBitSet)).toEqual([3, 70]);
  });

  test("reports empty through andNotInto when it removes everything", () => {
    const workingBitSet = createBitSet(40, 70);

    expect(make(40, 70).andNotInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("unions its positions into the accumulator through orInto", () => {
    const accumulatorBitSet = createBitSet(1);

    make(40, 70).orInto(accumulatorBitSet);
    expect(gatherPositions(accumulatorBitSet)).toEqual([1, 40, 70]);
  });

  test("sets every bit through orComplementInto except where the accumulator was 0 and it carries the position", () => {
    const accumulatorBitSet = createBitSet(5);

    make(5, 40).orComplementInto(accumulatorBitSet);
    expect(accumulatorBitSet.has(40)).toBe(false);
    expect(accumulatorBitSet.has(5)).toBe(true);
    expect(accumulatorBitSet.has(0)).toBe(true);
    expect(accumulatorBitSet.cardinality()).toBe(SIZE - 1);
  });
});

describe("EmptyPosting", () => {
  const emptyPosting = EMPTY_POSTING;

  test("has a count of zero", () => {
    expect(emptyPosting.cardinality).toBe(0);
  });

  test("seeds an empty working set", () => {
    expect(emptyPosting.toBitSet(SIZE).isEmpty()).toBe(true);
  });

  test("empties the working set through andInto and reports empty", () => {
    const workingBitSet = createBitSet(3, 40, 70);

    expect(emptyPosting.andInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("leaves the working set untouched through andNotInto and reports its emptiness", () => {
    const workingBitSet = createBitSet(3, 40);

    expect(emptyPosting.andNotInto(workingBitSet)).toBe(false);
    expect(gatherPositions(workingBitSet)).toEqual([3, 40]);
  });

  test("reports empty through andNotInto when the working set was already empty", () => {
    expect(emptyPosting.andNotInto(new BitSet(SIZE))).toBe(true);
  });

  test("leaves the accumulator untouched through orInto", () => {
    const accumulatorBitSet = createBitSet(1, 2);

    emptyPosting.orInto(accumulatorBitSet);
    expect(gatherPositions(accumulatorBitSet)).toEqual([1, 2]);
  });

  test("fills the accumulator through orComplementInto, since the complement of nothing is everything", () => {
    const accumulatorBitSet = createBitSet(5);

    emptyPosting.orComplementInto(accumulatorBitSet);
    expect(accumulatorBitSet.cardinality()).toBe(SIZE);
  });
});

describe("SparsePosting", () => {
  test("matches a dense posting's andInto result", () => {
    const denseWorkingBitSet = createBitSet(3, 40, 70, 90);
    const sparseWorkingBitSet = createBitSet(3, 40, 70, 90);

    createDensePosting(40, 70).andInto(denseWorkingBitSet);
    createSparsePosting(40, 70).andInto(sparseWorkingBitSet);
    expect(gatherPositions(denseWorkingBitSet)).toEqual(gatherPositions(sparseWorkingBitSet));
  });

  test("matches a dense posting's orComplementInto result", () => {
    const denseAccumulatorBitSet = createBitSet(5, 12);
    const sparseAccumulatorBitSet = createBitSet(5, 12);

    createDensePosting(5, 40, 88).orComplementInto(denseAccumulatorBitSet);
    createSparsePosting(5, 40, 88).orComplementInto(sparseAccumulatorBitSet);
    expect(gatherPositions(denseAccumulatorBitSet)).toEqual(gatherPositions(sparseAccumulatorBitSet));
  });
});
