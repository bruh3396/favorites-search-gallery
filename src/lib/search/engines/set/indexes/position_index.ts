export class PositionIndex<Doc> {
  private index: Map<Doc, number> = new Map<Doc, number>();

  public build(docs: readonly Doc[]): void {
    this.index = new Map(docs.map((doc, position) => [doc, position]));
  }

  public add(doc: Doc): void {
    if (!this.index.has(doc)) {
      this.index.set(doc, this.index.size);
    }
  }

  public positionOf(doc: Doc): number {
    return this.index.get(doc) ?? -1;
  }

  public complementOf(docs: readonly Doc[]): Doc[] {
    const excluded = new Set<Doc>(docs);
    const result: Doc[] = [];

    for (const doc of this.index.keys()) {
      if (!excluded.has(doc)) {
        result.push(doc);
      }
    }
    return result;
  }

  public sort(docs: Doc[]): Doc[] {
    return docs
      .map(doc => ({ doc, position: this.positionOf(doc) }))
      .sort((a, b) => a.position - b.position)
      .map(entry => entry.doc);
  }
}
