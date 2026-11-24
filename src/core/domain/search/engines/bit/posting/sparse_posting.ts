import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { PositionArray } from "@/core/domain/search/engines/bit/posting/position_array";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";

export class SparsePosting implements Posting {
  constructor(private readonly positionArray: PositionArray) { }

  public get cardinality(): number {
    return this.positionArray.length;
  }

  public toBitSet(size: number): BitSet {
    const workingBitSet = new BitSet(size);

    for (const position of this.positionArray) {
      workingBitSet.set(position);
    }
    return workingBitSet;
  }

  public andInto(workingBitSet: BitSet): boolean {
    return workingBitSet.andPositionsInPlace(this.positionArray);
  }

  public andNotInto(workingBitSet: BitSet): boolean {
    for (const position of this.positionArray) {
      workingBitSet.clear(position);
    }
    return workingBitSet.isEmpty();
  }

  public orInto(accumulatorBitSet: BitSet): void {
    for (const position of this.positionArray) {
      accumulatorBitSet.set(position);
    }
  }

  public orComplementInto(accumulatorBitSet: BitSet): void {
    const zerosAtPositions: number[] = [];

    for (const position of this.positionArray) {
      if (!accumulatorBitSet.has(position)) {
        zerosAtPositions.push(position);
      }
    }
    accumulatorBitSet.fill();

    for (const position of zerosAtPositions) {
      accumulatorBitSet.clear(position);
    }
  }
}
