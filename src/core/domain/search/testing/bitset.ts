import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";

export function createBitSet(size: number, positions: readonly number[]): BitSet {
  const bitSet = new BitSet(size);

  positions.forEach(position => bitSet.set(position));
  return bitSet;
}

export function gatherBitSetPositions(bitSet: BitSet): number[] {
  return bitSet.gather(Array.from({ length: bitSet.size }, (_, position) => position));
}
