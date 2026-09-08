import { BitSet } from "@/lib/search/engine/bitmap/bitset";

export interface Posting {
  readonly count: number;
  toBitSet(size: number): BitSet;
  andInto(working: BitSet): boolean;
  andNotInto(working: BitSet): boolean;
  orInto(accumulator: BitSet): void;
  orComplementInto(accumulator: BitSet): void;
}

export class DensePosting implements Posting {
  private cachedCount = -1;

  constructor(private readonly bits: BitSet) { }

  public get count(): number {
    if (this.cachedCount < 0) {
      this.cachedCount = this.bits.cardinality();
    }
    return this.cachedCount;
  }

  public toBitSet(): BitSet {
    return this.bits.clone();
  }

  public andInto(working: BitSet): boolean {
    return working.andInPlace(this.bits);
  }

  public andNotInto(working: BitSet): boolean {
    return working.andNotInPlace(this.bits);
  }

  public orInto(accumulator: BitSet): void {
    accumulator.orInPlace(this.bits);
  }

  public orComplementInto(accumulator: BitSet): void {
    accumulator.orComplementInPlace(this.bits);
  }
}

export class SparsePosting implements Posting {
  constructor(private readonly positions: Int32Array) { }

  public get count(): number {
    return this.positions.length;
  }

  public toBitSet(size: number): BitSet {
    const working = new BitSet(size);

    for (const position of this.positions) {
      working.add(position);
    }
    return working;
  }

  public andInto(working: BitSet): boolean {
    return working.andPositionsInPlace(this.positions);
  }

  public andNotInto(working: BitSet): boolean {
    for (const position of this.positions) {
      working.remove(position);
    }
    return working.isEmpty();
  }

  public orInto(accumulator: BitSet): void {
    for (const position of this.positions) {
      accumulator.add(position);
    }
  }

  public orComplementInto(accumulator: BitSet): void {
    const zerosAtPositions: number[] = [];

    for (const position of this.positions) {
      if (!accumulator.has(position)) {
        zerosAtPositions.push(position);
      }
    }
    accumulator.fill();

    for (const position of zerosAtPositions) {
      accumulator.remove(position);
    }
  }
}
