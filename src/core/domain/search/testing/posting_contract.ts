import { createBitSet, gatherBitSetPositions } from "@/core/domain/search/testing/bitset";
import { expect, test } from "vitest";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";

export const POSTING_CONTRACT_SIZE = 100;

export function testPostingContract(createPosting: (...positions: number[]) => Posting): void {
  test("reports its count", () => {
    expect(createPosting(3, 40, 70).cardinality).toBe(3);
  });

  test("seeds a working set with its positions", () => {
    expect(gatherBitSetPositions(createPosting(3, 40, 70).toBitSet(POSTING_CONTRACT_SIZE))).toEqual([3, 40, 70]);
  });

  test("intersects the working set through andInto and reports emptiness", () => {
    const workingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [3, 40, 70, 90]);

    expect(createPosting(40, 70).andInto(workingBitSet)).toBe(false);
    expect(gatherBitSetPositions(workingBitSet)).toEqual([40, 70]);
  });

  test("reports empty through andInto when the intersection is empty", () => {
    const workingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [1, 2, 3]);

    expect(createPosting(50, 60).andInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("subtracts its positions through andNotInto and reports emptiness", () => {
    const workingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [3, 40, 70]);

    expect(createPosting(40).andNotInto(workingBitSet)).toBe(false);
    expect(gatherBitSetPositions(workingBitSet)).toEqual([3, 70]);
  });

  test("reports empty through andNotInto when it removes everything", () => {
    const workingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [40, 70]);

    expect(createPosting(40, 70).andNotInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("unions its positions into the accumulator through orInto", () => {
    const accumulatorBitSet = createBitSet(POSTING_CONTRACT_SIZE, [1]);

    createPosting(40, 70).orInto(accumulatorBitSet);
    expect(gatherBitSetPositions(accumulatorBitSet)).toEqual([1, 40, 70]);
  });

  test("sets every bit through orComplementInto except where the accumulator was 0 and it carries the position", () => {
    const accumulatorBitSet = createBitSet(POSTING_CONTRACT_SIZE, [5]);

    createPosting(5, 40).orComplementInto(accumulatorBitSet);
    expect(accumulatorBitSet.has(40)).toBe(false);
    expect(accumulatorBitSet.has(5)).toBe(true);
    expect(accumulatorBitSet.has(0)).toBe(true);
    expect(accumulatorBitSet.cardinality()).toBe(POSTING_CONTRACT_SIZE - 1);
  });
}
