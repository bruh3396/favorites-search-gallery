// De Bruijn sequence for O(1) trailing-zero count, avoiding the native Math.clz32
// call (~200x slower in the Tampermonkey sandbox). Index by the isolated lowest
// set bit multiplied by the constant, shifted to the top 5 bits.
const DE_BRUIJN_BIT_POSITION = new Int8Array([
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
]);

export class BitSet {
  private readonly bits: Uint32Array;

  constructor(public readonly size: number) {
    this.bits = new Uint32Array(Math.ceil(size / 32));
  }

  public add(position: number): void {
    this.bits[position >>> 5] |= 1 << (position & 31);
  }

  public remove(position: number): void {
    this.bits[position >>> 5] &= ~(1 << (position & 31));
  }

  public has(position: number): boolean {
    return (this.bits[position >>> 5] & (1 << (position & 31))) !== 0;
  }

  public and(other: BitSet): BitSet {
    return this.clone().andInPlace(other);
  }

  public or(other: BitSet): BitSet {
    return this.clone().orInPlace(other);
  }

  public andNot(other: BitSet): BitSet {
    return this.clone().andNotInPlace(other);
  }

  public andInPlace(other: BitSet): this {
    this.assertSameSize(other);

    for (let i = 0; i < this.bits.length; i += 1) {
      this.bits[i] &= other.bits[i];
    }
    return this;
  }

  public orInPlace(other: BitSet): this {
    this.assertSameSize(other);

    for (let i = 0; i < this.bits.length; i += 1) {
      this.bits[i] |= other.bits[i];
    }
    return this;
  }

  public andNotInPlace(other: BitSet): this {
    this.assertSameSize(other);

    for (let i = 0; i < this.bits.length; i += 1) {
      this.bits[i] &= ~other.bits[i];
    }
    return this;
  }

  public andInPlaceIsEmpty(other: BitSet): boolean {
    this.assertSameSize(other);
    let remaining = 0;

    for (let i = 0; i < this.bits.length; i += 1) {
      remaining |= (this.bits[i] &= other.bits[i]);
    }
    return remaining === 0;
  }

  public andNotInPlaceIsEmpty(other: BitSet): boolean {
    this.assertSameSize(other);
    let remaining = 0;

    for (let i = 0; i < this.bits.length; i += 1) {
      remaining |= (this.bits[i] &= ~other.bits[i]);
    }
    return remaining === 0;
  }

  public orComplementInPlace(other: BitSet): this {
    this.assertSameSize(other);

    for (let i = 0; i < this.bits.length; i += 1) {
      this.bits[i] |= ~other.bits[i];
    }
    this.clearHighBits();
    return this;
  }

  private clearHighBits(): void {
    const remainder = this.size & 31;

    if (remainder !== 0 && this.bits.length > 0) {
      this.bits[this.bits.length - 1] &= (1 << remainder) - 1;
    }
  }

  public clone(): BitSet {
    const copy = new BitSet(this.size);

    copy.bits.set(this.bits);
    return copy;
  }

  public retainPositions(positions: Int32Array): boolean {
    const survivors: number[] = [];

    for (const position of positions) {
      if (this.has(position)) {
        survivors.push(position);
      }
    }
    this.bits.fill(0);

    for (const position of survivors) {
      this.add(position);
    }
    return survivors.length === 0;
  }

  public clear(): void {
    this.bits.fill(0);
  }

  public fill(): void {
    this.bits.fill(0xFFFFFFFF);
    this.clearHighBits();
  }

  public isEmpty(): boolean {
    for (let i = 0; i < this.bits.length; i += 1) {
      if (this.bits[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  public count(): number {
    let count = 0;

    // SWAR (parallel bit-count): constant work per word regardless of how many
    // bits are set, unlike the Kernighan loop which iterates once per set bit —
    // a large win on dense words (blacklist/tautology results are near-full).
    for (const word of this.bits) {
      let value = word - ((word >>> 1) & 0x55555555);

      value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
      value = (value + (value >>> 4)) & 0x0F0F0F0F;
      count += (value * 0x01010101) >>> 24;
    }
    return count;
  }

  public positions(): number[] {
    const positions: number[] = [];

    this.forEachPosition(position => positions.push(position));
    return positions;
  }

  // Visits every set position in ascending order. Callers that would otherwise
  // build a positions array only to map over it (e.g. materializing docs) should
  // use this to avoid the intermediate allocation.
  public forEachPosition(visit: (position: number) => void): void {
    for (let wordIndex = 0; wordIndex < this.bits.length; wordIndex += 1) {
      let word = this.bits[wordIndex];

      while (word !== 0) {
        const lowestSetBit = (word & -word) >>> 0;
        const bit = DE_BRUIJN_BIT_POSITION[(lowestSetBit * 0x077CB531) >>> 27];

        visit((wordIndex << 5) + bit);
        word &= word - 1;
      }
    }
  }

  private assertSameSize(other: BitSet): void {
    if (other.size !== this.size) {
      throw new Error(`BitSet size mismatch: ${this.size} vs ${other.size}`);
    }
  }
}
