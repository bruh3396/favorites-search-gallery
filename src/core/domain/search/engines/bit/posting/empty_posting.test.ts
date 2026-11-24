import { createBitSet, gatherBitSetPositions } from "@/core/domain/search/testing/bitset";
import { describe, expect, test } from "vitest";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { EMPTY_POSTING } from "@/core/domain/search/engines/bit/posting/empty_posting";
import { POSTING_CONTRACT_SIZE } from "@/core/domain/search/testing/posting_contract";

describe("EMPTY_POSTING", () => {
  test("counts zero posts", () => {
    expect(EMPTY_POSTING.cardinality).toBe(0);
  });

  test("seeds an empty working set", () => {
    expect(EMPTY_POSTING.toBitSet(POSTING_CONTRACT_SIZE).isEmpty()).toBe(true);
  });

  test("empties the working set through andInto and reports empty", () => {
    const workingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [3, 40, 70]);

    expect(EMPTY_POSTING.andInto(workingBitSet)).toBe(true);
    expect(workingBitSet.isEmpty()).toBe(true);
  });

  test("leaves the working set untouched through andNotInto and reports its emptiness", () => {
    const workingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [3, 40]);

    expect(EMPTY_POSTING.andNotInto(workingBitSet)).toBe(false);
    expect(gatherBitSetPositions(workingBitSet)).toEqual([3, 40]);
  });

  test("reports empty through andNotInto when the working set was already empty", () => {
    expect(EMPTY_POSTING.andNotInto(new BitSet(POSTING_CONTRACT_SIZE))).toBe(true);
  });

  test("leaves the accumulator untouched through orInto", () => {
    const accumulatorBitSet = createBitSet(POSTING_CONTRACT_SIZE, [1, 2]);

    EMPTY_POSTING.orInto(accumulatorBitSet);
    expect(gatherBitSetPositions(accumulatorBitSet)).toEqual([1, 2]);
  });

  test("fills the accumulator through orComplementInto, since the complement of nothing is everything", () => {
    const accumulatorBitSet = createBitSet(POSTING_CONTRACT_SIZE, [5]);

    EMPTY_POSTING.orComplementInto(accumulatorBitSet);
    expect(accumulatorBitSet.cardinality()).toBe(POSTING_CONTRACT_SIZE);
  });
});
