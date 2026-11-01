import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { PositionArray } from "@/core/domain/search/engines/bit/posting/position_array";

export interface Posting {
  readonly cardinality: number;
  toBitSet(size: number): BitSet;
  andInto(workingBitSet: BitSet): boolean;
  andNotInto(workingBitSet: BitSet): boolean;
  orInto(accumulatorBitSet: BitSet): void;
  orComplementInto(accumulatorBitSet: BitSet): void;
}

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

const EMPTY_POSITIONS = new Uint8Array(0);

export const EMPTY_POSTING: Posting = new EmptyPosting();
