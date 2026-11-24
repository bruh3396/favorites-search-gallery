import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";

const EMPTY_POSITIONS = new Uint8Array(0);

class EmptyPosting implements Posting {
  public readonly cardinality = 0;

  public toBitSet(size: number): BitSet {
    return new BitSet(size);
  }

  public andInto(workingBitSet: BitSet): boolean {
    workingBitSet.andPositionsInPlace(EMPTY_POSITIONS);
    return true;
  }

  public andNotInto(workingBitSet: BitSet): boolean {
    return workingBitSet.isEmpty();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public orInto(_accumulator: BitSet): void { }

  public orComplementInto(accumulatorBitSet: BitSet): void {
    accumulatorBitSet.fill();
  }
}

export const EMPTY_POSTING: Posting = new EmptyPosting();
