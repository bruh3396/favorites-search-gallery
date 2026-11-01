import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { DocTable } from "@/core/domain/search/engines/bit/indexes/doc_table";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";

export class BitAlgebra<Doc> {
  private occupiedBitSet: BitSet = new BitSet(0);

  constructor(private readonly docTable: DocTable<Doc>) { }

  public reset(): void {
    this.occupiedBitSet = new BitSet(this.docTable.width);
  }

  public occupy(position: number): void {
    this.occupiedBitSet.set(position);
  }

  public universe(): BitSet {
    return this.occupiedBitSet.clone();
  }

  public empty(): BitSet {
    return new BitSet(this.docTable.width);
  }

  public docsFrom(bitSet: BitSet): readonly Doc[] {
    return bitSet.gather(this.docTable.allDocs());
  }

  public bitSetFrom(posting: Posting): BitSet {
    const bitSet = this.empty();

    posting.orInto(bitSet);
    return bitSet;
  }

  public complementOf(bitSet: BitSet): BitSet {
    const universeBitSet = this.universe();

    universeBitSet.andNotInPlace(bitSet);
    return universeBitSet;
  }

  public unionOf(postings: readonly Posting[]): BitSet {
    const unionBitSet = this.empty();

    for (const posting of postings) {
      posting.orInto(unionBitSet);
    }
    return unionBitSet;
  }
}
