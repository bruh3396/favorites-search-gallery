const MIN_CAPACITY = 64;

export class DocTable<Doc> {
  private docs: Doc[] = [];
  private positionByDoc: Map<Doc, number> = new Map<Doc, number>();
  private freeList: number[] = [];
  private liveCount = 0;
  private capacity = 0;

  public get size(): number {
    return this.liveCount;
  }

  public get width(): number {
    return this.capacity;
  }

  public reset(occupiedCount: number, minCapacity: number): void {
    this.capacity = capacityFor(Math.max(occupiedCount, minCapacity));
    this.docs = new Array<Doc>(this.capacity);
    this.positionByDoc = new Map<Doc, number>();
    this.freeList = [];
    this.liveCount = 0;

    for (let position = this.capacity - 1; position >= occupiedCount; position -= 1) {
      this.freeList.push(position);
    }
  }

  public hasRoomFor(count: number): boolean {
    return this.liveCount + count < this.capacity;
  }

  public allocate(): number | undefined {
    return this.freeList.pop();
  }

  public place(doc: Doc, position: number): void {
    this.docs[position] = doc;
    this.positionByDoc.set(doc, position);
    this.liveCount += 1;
  }

  public positionOf(doc: Doc): number | undefined {
    return this.positionByDoc.get(doc);
  }

  public liveDocs(): Doc[] {
    const live: Doc[] = [];

    for (const doc of this.docs) {
      if (doc !== undefined) {
        live.push(doc);
      }
    }
    return live;
  }

  public allDocs(): readonly Doc[] {
    return this.docs;
  }
}

function capacityFor(size: number): number {
  let capacity = MIN_CAPACITY;

  while (capacity <= size) {
    capacity *= 2;
  }
  return capacity;
}
