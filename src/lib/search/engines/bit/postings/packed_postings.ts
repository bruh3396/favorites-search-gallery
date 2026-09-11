export class PackedPostings {
  private values: Int32Array = new Int32Array(0);
  private readonly offsets = new Map<string, number>();
  private readonly lengths = new Map<string, number>();

  public build(positionsByTerm: ReadonlyMap<string, number[]>, isSparse: (length: number) => boolean): void {
    this.offsets.clear();
    this.lengths.clear();

    let total = 0;

    for (const positions of positionsByTerm.values()) {
      if (isSparse(positions.length)) {
        total += positions.length;
      }
    }
    this.values = new Int32Array(total);

    let cursor = 0;

    for (const [term, positions] of positionsByTerm) {
      if (!isSparse(positions.length)) {
        continue;
      }
      this.values.set(positions, cursor);
      this.offsets.set(term, cursor);
      this.lengths.set(term, positions.length);
      cursor += positions.length;
    }
  }

  public has(term: string): boolean {
    return this.offsets.has(term);
  }

  public terms(): IterableIterator<string> {
    return this.offsets.keys();
  }

  public slice(term: string): Int32Array | undefined {
    const offset = this.offsets.get(term);

    if (offset === undefined) {
      return undefined;
    }
    return this.values.subarray(offset, offset + (this.lengths.get(term) as number));
  }
}
