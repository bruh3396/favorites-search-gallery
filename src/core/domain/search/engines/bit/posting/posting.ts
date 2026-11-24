import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";

export interface Posting {
  readonly cardinality: number;
  toBitSet(size: number): BitSet;
  andInto(workingBitSet: BitSet): boolean;
  andNotInto(workingBitSet: BitSet): boolean;
  orInto(accumulatorBitSet: BitSet): void;
  orComplementInto(accumulatorBitSet: BitSet): void;
}
