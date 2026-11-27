import { createBitSet, gatherBitSetPositions } from "@/core/domain/search/testing/bitset";
import { expect, test } from "vitest";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";

const BIT_SET_SIZE = 100;

export function testPostingContract(createPosting: (positions: number[], size: number) => Posting): void {
  test("reports its count", () => {
    expect(createPosting([3, 40, 70], BIT_SET_SIZE).cardinality).toBe(3);
  });

  test("seeds a working set with its positions", () => {
    expect(gatherBitSetPositions(createPosting([3, 40, 70], BIT_SET_SIZE).toBitSet(BIT_SET_SIZE))).toEqual([3, 40, 70]);
  });

  test("intersects the working set through andInto and reports emptiness", () => {
    const workingBitSet = createBitSet(BIT_SET_SIZE, [3, 40, 70, 90]);

    expect(createPosting([40, 70], BIT_SET_SIZE).andInto(workingBitSet)).toBe(false);
    expect(gatherBitSetPositions(workingBitSet)).toEqual([40, 70]);
  });

  test("reports empty through andInto when the intersection is empty", () => {
    const workingBitSet = createBitSet(BIT_SET_SIZE, [1, 2, 3]);

    expect(createPosting([50, 60], BIT_SET_SIZE).andInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("subtracts its positions through andNotInto and reports emptiness", () => {
    const workingBitSet = createBitSet(BIT_SET_SIZE, [3, 40, 70]);

    expect(createPosting([40], BIT_SET_SIZE).andNotInto(workingBitSet)).toBe(false);
    expect(gatherBitSetPositions(workingBitSet)).toEqual([3, 70]);
  });

  test("reports empty through andNotInto when it removes everything", () => {
    const workingBitSet = createBitSet(BIT_SET_SIZE, [40, 70]);

    expect(createPosting([40, 70], BIT_SET_SIZE).andNotInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("unions its positions into the accumulator through orInto", () => {
    const accumulatorBitSet = createBitSet(BIT_SET_SIZE, [1]);

    createPosting([40, 70], BIT_SET_SIZE).orInto(accumulatorBitSet);
    expect(gatherBitSetPositions(accumulatorBitSet)).toEqual([1, 40, 70]);
  });

  test("sets every bit through orComplementInto except where the accumulator was 0 and it carries the position", () => {
    const accumulatorBitSet = createBitSet(BIT_SET_SIZE, [5]);

    createPosting([5, 40], BIT_SET_SIZE).orComplementInto(accumulatorBitSet);
    expect(accumulatorBitSet.has(40)).toBe(false);
    expect(accumulatorBitSet.has(5)).toBe(true);
    expect(accumulatorBitSet.has(0)).toBe(true);
    expect(accumulatorBitSet.cardinality()).toBe(BIT_SET_SIZE - 1);
  });
}
