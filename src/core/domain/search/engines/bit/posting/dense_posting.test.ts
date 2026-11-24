import { POSTING_CONTRACT_SIZE, testPostingContract } from "@/core/domain/search/testing/posting_contract";
import { DensePosting } from "@/core/domain/search/engines/bit/posting/dense_posting";
import { createBitSet } from "@/core/domain/search/testing/bitset";
import { describe } from "vitest";

describe("DensePosting", () => {
  testPostingContract((...positions) => new DensePosting(createBitSet(POSTING_CONTRACT_SIZE, positions)));
});
