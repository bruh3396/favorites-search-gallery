import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";

export class DensePosting implements Posting {
  private cachedCount = -1;

  constructor(private readonly bitSet: BitSet) { }

  public get cardinality(): number {
    if (this.cachedCount < 0) {
      this.cachedCount = this.bitSet.cardinality();
    }
    return this.cachedCount;
  }

  public toBitSet(): BitSet {
    return this.bitSet.clone();
  }

  public positions(): number[] {
    return this.bitSet.positions();
  }

  public andInto(workingBitSet: BitSet): boolean {
    return workingBitSet.andInPlace(this.bitSet);
  }

  public andNotInto(workingBitSet: BitSet): boolean {
    return workingBitSet.andNotInPlace(this.bitSet);
  }

  public orInto(accumulatorBitSet: BitSet): void {
    accumulatorBitSet.orInPlace(this.bitSet);
  }

  public orComplementInto(accumulatorBitSet: BitSet): void {
    accumulatorBitSet.orComplementInPlace(this.bitSet);
  }
}
