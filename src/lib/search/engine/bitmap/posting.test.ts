import { DensePosting, Posting, SparsePosting } from "@/lib/search/engine/bitmap/posting";
import { describe, expect, it } from "vitest";
import { BitSet } from "@/lib/search/engine/bitmap/bitset";

const SIZE = 100;

function bitSet(...positions: number[]): BitSet {
  const set = new BitSet(SIZE);

  for (const position of positions) {
    set.add(position);
  }
  return set;
}

function positionsOf(set: BitSet): number[] {
  const positions: number[] = [];

  set.forEachPosition(position => positions.push(position));
  return positions;
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
  it("reports its count", () => {
    expect(make(3, 40, 70).count).toBe(3);
  });

  it("seeds a working set with its positions", () => {
    expect(positionsOf(make(3, 40, 70).seed(SIZE))).toEqual([3, 40, 70]);
  });

  it("andInto intersects the working set and reports emptiness", () => {
    const working = bitSet(3, 40, 70, 90);

    expect(make(40, 70).andInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([40, 70]);
  });

  it("andInto reports empty when the intersection is empty", () => {
    const working = bitSet(1, 2, 3);

    expect(make(50, 60).andInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  it("andNotInto subtracts its positions and reports emptiness", () => {
    const working = bitSet(3, 40, 70);

    expect(make(40).andNotInto(working)).toBe(false);
    expect(positionsOf(working)).toEqual([3, 70]);
  });

  it("andNotInto reports empty when it removes everything", () => {
    const working = bitSet(40, 70);

    expect(make(40, 70).andNotInto(working)).toBe(true);
    expect(working.isEmpty()).toBe(true);
  });

  it("orInto unions its positions into the accumulator", () => {
    const accumulator = bitSet(1);

    make(40, 70).orInto(accumulator);
    expect(positionsOf(accumulator)).toEqual([1, 40, 70]);
  });

  it("orComplementInto sets every bit except where the accumulator was 0 and it carries the position", () => {
    const accumulator = bitSet(5);

    make(5, 40).orComplementInto(accumulator);
    expect(accumulator.has(40)).toBe(false);
    expect(accumulator.has(5)).toBe(true);
    expect(accumulator.has(0)).toBe(true);
    expect(accumulator.count()).toBe(SIZE - 1);
  });
});

describe("dense and sparse agree", () => {
  it("produce the same andInto result", () => {
    const denseWorking = bitSet(3, 40, 70, 90);
    const sparseWorking = bitSet(3, 40, 70, 90);

    dense(40, 70).andInto(denseWorking);
    sparse(40, 70).andInto(sparseWorking);
    expect(positionsOf(denseWorking)).toEqual(positionsOf(sparseWorking));
  });

  it("produce the same orComplementInto result", () => {
    const denseAcc = bitSet(5, 12);
    const sparseAcc = bitSet(5, 12);

    dense(5, 40, 88).orComplementInto(denseAcc);
    sparse(5, 40, 88).orComplementInto(sparseAcc);
    expect(positionsOf(denseAcc)).toEqual(positionsOf(sparseAcc));
  });
});
