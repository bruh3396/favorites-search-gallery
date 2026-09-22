import { PositionArray } from "@/lib/search/engines/bit/postings/bitset";

export class PackedPostings {
  private positions: PositionArray = new Uint8Array(0);
  private offsets: Uint32Array = new Uint32Array(0);
  private readonly slotByTerm = new Map<string, number>();

  public pack(sparseTerms: ReadonlyArray<readonly [string, number[]]>, totalPositions: number, maxPosition: number): void {
    this.slotByTerm.clear();
    this.positions = newPositionArray(totalPositions, maxPosition);
    this.offsets = new Uint32Array(sparseTerms.length + 1);
    let cursor = 0;
    let slot = 0;

    for (const [term, positions] of sparseTerms) {
      this.positions.set(positions, cursor);
      this.slotByTerm.set(term, slot);
      this.offsets[slot] = cursor;
      cursor += positions.length;
      slot += 1;
    }
    this.offsets[slot] = cursor;
  }

  public has(term: string): boolean {
    return this.slotByTerm.has(term);
  }

  public terms(): IterableIterator<string> {
    return this.slotByTerm.keys();
  }

  public positionsFor(term: string): PositionArray | undefined {
    const slot = this.slotByTerm.get(term);

    if (slot === undefined) {
      return undefined;
    }
    return this.positions.subarray(this.offsets[slot], this.offsets[slot + 1]);
  }
}

function newPositionArray(length: number, max: number): PositionArray {
  if (max <= 0xff) {
    return new Uint8Array(length);
  }

  if (max <= 0xffff) {
    return new Uint16Array(length);
  }
  return new Uint32Array(length);
}
