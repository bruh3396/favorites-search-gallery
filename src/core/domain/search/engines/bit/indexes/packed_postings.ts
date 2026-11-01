import { PositionArray } from "@/core/domain/search/engines/bit/posting/position_array";

export class PackedPostings {
  private positionArray: PositionArray = new Uint8Array(0);
  private offsets: Uint32Array = new Uint32Array(0);
  private readonly slotByTerm = new Map<string, number>();

  public pack(sparseTerms: ReadonlyArray<readonly [string, number[]]>, totalPositions: number, maxPosition: number): void {
    this.slotByTerm.clear();
    this.positionArray = newPositionArray(totalPositions, maxPosition);
    this.offsets = new Uint32Array(sparseTerms.length + 1);
    let cursor = 0;
    let slot = 0;

    for (const [term, positions] of sparseTerms) {
      this.positionArray.set(positions, cursor);
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

  public findPositions(term: string): PositionArray | undefined {
    const slot = this.slotByTerm.get(term);
    return slot === undefined ? undefined : this.positionsAt(slot);
  }

  public forEachTerm(visit: (term: string, positionArray: PositionArray) => void): void {
    for (const [term, slot] of this.slotByTerm) {
      visit(term, this.positionsAt(slot));
    }
  }

  private positionsAt(slot: number): PositionArray {
    return this.positionArray.subarray(this.offsets[slot], this.offsets[slot + 1]);
  }
}

function newPositionArray(length: number, max: number): PositionArray {
  if (max <= 0xff) {
    return new Uint8Array(length);
  }

  if (max <= 0xff_ff) {
    return new Uint16Array(length);
  }
  return new Uint32Array(length);
}
