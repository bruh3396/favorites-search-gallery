import { DensePosting, Posting, SparsePosting } from "@/lib/search/bitmap/posting";
import { BitSet } from "@/lib/search/bitmap/bitset";

export class BitmapIndex<Doc> {
  private docs: Doc[] = [];
  private postings: Map<string, Posting> = new Map<string, Posting>();
  private all: BitSet = new BitSet(0);

  constructor(private readonly extractTerms: (doc: Doc) => Iterable<string>) { }

  public get size(): number {
    return this.docs.length;
  }

  private get denseThreshold(): number {
    return Math.ceil(this.size / 32);
  }

  public build(docs: readonly Doc[]): void {
    this.docs = [...docs];
    this.postings = this.materializePostings(this.collectPositions());
    this.all = this.buildEverything();
  }

  public indexedTerms(): string[] {
    return [...this.postings.keys()];
  }

  public postingForTerm(term: string): Posting | undefined {
    return this.postings.get(term);
  }

  public everything(): BitSet {
    return this.all.clone();
  }

  public emptyBitSet(): BitSet {
    return new BitSet(this.size);
  }

  public unionOf(terms: Iterable<string>): BitSet {
    const union = new BitSet(this.size);

    for (const term of terms) {
      this.postings.get(term)?.orInto(union);
    }
    return union;
  }

  public orTermInto(accumulator: BitSet, term: string): void {
    this.postings.get(term)?.orInto(accumulator);
  }

  public docAt(position: number): Doc {
    return this.docs[position];
  }

  public docsFrom(bitset: BitSet): Doc[] {
    const docs: Doc[] = [];

    bitset.forEachPosition(position => docs.push(this.docs[position]));
    return docs;
  }

  private collectPositions(): Map<string, number[]> {
    const positionsByTerm = new Map<string, number[]>();

    for (let position = 0; position < this.docs.length; position += 1) {
      for (const term of this.extractTerms(this.docs[position])) {
        const positions = positionsByTerm.get(term);

        if (positions === undefined) {
          positionsByTerm.set(term, [position]);
        } else {
          positions.push(position);
        }
      }
    }
    return positionsByTerm;
  }

  private materializePostings(positionsByTerm: Map<string, number[]>): Map<string, Posting> {
    const threshold = this.denseThreshold;
    const postings = new Map<string, Posting>();

    for (const [term, positions] of positionsByTerm) {
      postings.set(term, positions.length > threshold ? this.dense(positions) : new SparsePosting(Int32Array.from(positions)));
    }
    return postings;
  }

  private dense(positions: number[]): DensePosting {
    const bits = new BitSet(this.size);

    for (const position of positions) {
      bits.add(position);
    }
    return new DensePosting(bits);
  }

  private buildEverything(): BitSet {
    const all = new BitSet(this.size);

    all.fill();
    return all;
  }
}
