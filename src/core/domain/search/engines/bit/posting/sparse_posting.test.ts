import { POSTING_CONTRACT_SIZE, testPostingContract } from "@/core/domain/search/testing/posting_contract";
import { createBitSet, gatherBitSetPositions } from "@/core/domain/search/testing/bitset";
import { describe, expect, test } from "vitest";
import { DensePosting } from "@/core/domain/search/engines/bit/posting/dense_posting";
import { SparsePosting } from "@/core/domain/search/engines/bit/posting/sparse_posting";

function createDensePosting(...positions: number[]): DensePosting {
  return new DensePosting(createBitSet(POSTING_CONTRACT_SIZE, positions));
}

function createSparsePosting(...positions: number[]): SparsePosting {
  return new SparsePosting(Uint32Array.from(positions));
}

describe("SparsePosting", () => {
  testPostingContract(createSparsePosting);

  test("matches a dense posting's andInto result", () => {
    const denseWorkingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [3, 40, 70, 90]);
    const sparseWorkingBitSet = createBitSet(POSTING_CONTRACT_SIZE, [3, 40, 70, 90]);

    createDensePosting(40, 70).andInto(denseWorkingBitSet);
    createSparsePosting(40, 70).andInto(sparseWorkingBitSet);
    expect(gatherBitSetPositions(denseWorkingBitSet)).toEqual(gatherBitSetPositions(sparseWorkingBitSet));
  });

  test("matches a dense posting's orComplementInto result", () => {
    const denseAccumulatorBitSet = createBitSet(POSTING_CONTRACT_SIZE, [5, 12]);
    const sparseAccumulatorBitSet = createBitSet(POSTING_CONTRACT_SIZE, [5, 12]);

    createDensePosting(5, 40, 88).orComplementInto(denseAccumulatorBitSet);
    createSparsePosting(5, 40, 88).orComplementInto(sparseAccumulatorBitSet);
    expect(gatherBitSetPositions(denseAccumulatorBitSet)).toEqual(gatherBitSetPositions(sparseAccumulatorBitSet));
  });
});
