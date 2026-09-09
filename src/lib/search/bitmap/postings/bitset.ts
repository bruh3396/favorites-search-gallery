const DE_BRUIJN_BIT_POSITION = new Int8Array([
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
]);

export class BitSet {
  private readonly words: Uint32Array;
  private scratch = new Int32Array(0);

  constructor(public readonly size: number) {
    this.words = new Uint32Array(Math.ceil(size / 32));
  }

  public add(position: number): void {
    this.words[position >>> 5] |= 1 << (position & 31);
  }

  public remove(position: number): void {
    this.words[position >>> 5] &= ~(1 << (position & 31));
  }

  public has(position: number): boolean {
    return (this.words[position >>> 5] & (1 << (position & 31))) !== 0;
  }

  public cardinality(): number {
    let cardinality = 0;

    for (const word of this.words) {
      let value = word - ((word >>> 1) & 0x55555555);

      value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
      value = (value + (value >>> 4)) & 0x0F0F0F0F;
      cardinality += (value * 0x01010101) >>> 24;
    }
    return cardinality;
  }

  public orInPlace(other: BitSet): void {
    this.assertSameSize(other);

    for (let i = 0; i < this.words.length; i += 1) {
      this.words[i] |= other.words[i];
    }
  }

  public andInPlace(other: BitSet): boolean {
    this.assertSameSize(other);
    let remaining = 0;

    for (let i = 0; i < this.words.length; i += 1) {
      this.words[i] &= other.words[i];
      remaining |= this.words[i];
    }
    return remaining === 0;
  }

  public andPositionsInPlace(positions: Int32Array): boolean {
    const survivors = this.getScratch(positions.length);
    let count = 0;

    for (const position of positions) {
      if (this.has(position)) {
        survivors[count] = position;
        count += 1;
      }
    }
    this.words.fill(0);

    for (let i = 0; i < count; i += 1) {
      this.add(survivors[i]);
    }
    return count === 0;
  }

  public andNotInPlace(other: BitSet): boolean {
    this.assertSameSize(other);
    let remaining = 0;

    for (let i = 0; i < this.words.length; i += 1) {
      this.words[i] &= ~other.words[i];
      remaining |= this.words[i];
    }
    return remaining === 0;
  }

  public orComplementInPlace(other: BitSet): this {
    this.assertSameSize(other);

    for (let i = 0; i < this.words.length; i += 1) {
      this.words[i] |= ~other.words[i];
    }
    this.clearHighBits();
    return this;
  }

  public clone(): BitSet {
    const copy = new BitSet(this.size);

    copy.words.set(this.words);
    return copy;
  }

  public fill(): void {
    this.words.fill(0xFFFFFFFF);
    this.clearHighBits();
  }

  public isEmpty(): boolean {
    for (let i = 0; i < this.words.length; i += 1) {
      if (this.words[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  public gather<T>(source: readonly T[]): T[] {
    const result = new Array<T>(this.cardinality());
    let next = 0;

    for (let wordIndex = 0; wordIndex < this.words.length; wordIndex += 1) {
      let word = this.words[wordIndex];
      const base = wordIndex << 5;

      while (word !== 0) {
        const lowestSetBit = (word & -word) >>> 0;
        const bit = DE_BRUIJN_BIT_POSITION[(lowestSetBit * 0x077CB531) >>> 27];

        result[next] = source[base + bit];
        next += 1;
        word &= word - 1;
      }
    }
    return result;
  }

  private getScratch(size: number): Int32Array {
    if (this.scratch.length < size) {
      this.scratch = new Int32Array(size);
    }
    return this.scratch;
  }

  private clearHighBits(): void {
    const remainder = this.size & 31;

    if (remainder !== 0 && this.words.length > 0) {
      this.words[this.words.length - 1] &= (1 << remainder) - 1;
    }
  }

  private assertSameSize(other: BitSet): void {
    if (other.size !== this.size) {
      throw new Error(`BitSet size mismatch: ${this.size} vs ${other.size}`);
    }
  }
}
