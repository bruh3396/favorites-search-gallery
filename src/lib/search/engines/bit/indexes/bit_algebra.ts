import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { DocTable } from "@/lib/search/engines/bit/indexes/doc_table";
import { Posting } from "@/lib/search/engines/bit/postings/posting";

export class BitAlgebra<Doc> {
  private occupied: BitSet = new BitSet(0);

  constructor(private readonly table: DocTable<Doc>) { }

  public reset(): void {
    this.occupied = new BitSet(this.table.width);
  }

  public occupy(position: number): void {
    this.occupied.set(position);
  }

  public universe(): BitSet {
    return this.occupied.clone();
  }

  public empty(): BitSet {
    return new BitSet(this.table.width);
  }

  public docsFrom(bitset: BitSet): Doc[] {
    return bitset.gather(this.table.allDocs());
  }

  public bitSetFrom(posting: Posting): BitSet {
    const bitSet = this.empty();

    posting.orInto(bitSet);
    return bitSet;
  }

  public complementOf(bitset: BitSet): BitSet {
    const universe = this.universe();

    universe.andNotInPlace(bitset);
    return universe;
  }

  public docComplementOf(docs: readonly Doc[], filter?: BitSet): Doc[] {
    const excluded = this.empty();

    for (const doc of docs) {
      const position = this.table.positionOf(doc);

      if (position !== undefined) {
        excluded.set(position);
      }
    }
    const result = this.complementOf(excluded);

    if (filter !== undefined) {
      result.andInPlace(filter);
    }
    return this.docsFrom(result);
  }

  public unionOf(postings: readonly Posting[]): BitSet {
    const union = this.empty();

    for (const posting of postings) {
      posting.orInto(union);
    }
    return union;
  }
}
