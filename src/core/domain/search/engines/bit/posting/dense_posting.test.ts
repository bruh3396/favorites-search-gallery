import { DensePosting } from "@/core/domain/search/engines/bit/posting/dense_posting";
import { createBitSet } from "@/core/domain/search/testing/bitset";
import { describe } from "vitest";
import { testPostingContract } from "@/core/domain/search/testing/posting_contract_tester";

describe("DensePosting", () => {
  testPostingContract((positions, size) => new DensePosting(createBitSet(size, positions)));
});
