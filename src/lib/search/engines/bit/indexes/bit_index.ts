import { DensePosting, Posting, SparsePosting } from "@/lib/search/engines/bit/postings/posting";
import { TermDelta, TermUpdate } from "@/lib/search/engines/search_engine";
import { insertSorted, removeValue } from "@/utils/pure/array";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { PackedPostings } from "@/lib/search/engines/bit/postings/packed_postings";

const MIN_CAPACITY = 64;

export class BitIndex<Doc> {
  private docs: Doc[] = [];
  private positionsByTerm: Map<string, number[]> = new Map<string, number[]>();
  private positionOf: Map<Doc, number> = new Map<Doc, number>();
  private freeList: number[] = [];
  private liveCount = 0;
  private capacity = 0;
  private densePostings: Map<string, DensePosting> = new Map<string, DensePosting>();
  private sparsePostings: PackedPostings = new PackedPostings();
  private all: BitSet = new BitSet(0);
  private positionsDropped = false;

  constructor(private readonly termsFor: (doc: Doc) => Iterable<string>) { }

  public get size(): number {
    return this.liveCount;
  }

  public get width(): number {
    return this.capacity;
  }

  public build(docs: readonly Doc[], minCapacity: number = docs.length): void {
    this.capacity = capacityFor(Math.max(docs.length, minCapacity));
    this.docs = new Array<Doc>(this.capacity);
    this.positionsByTerm = new Map<string, number[]>();
    this.positionOf = new Map<Doc, number>();
    this.freeList = [];
    this.liveCount = 0;
    this.all = new BitSet(this.capacity);

    for (let position = this.capacity - 1; position >= docs.length; position -= 1) {
      this.freeList.push(position);
    }

    for (let position = 0; position < docs.length; position += 1) {
      this.place(docs[position], position);
    }
    this.materialize();
  }

  public add(docs: readonly Doc[]): string[] {
    this.ensureCapacity(this.liveCount + docs.length);
    this.hydrate();
    const newTerms = new Set<string>();

    for (const doc of docs) {
      const position = this.freeList.pop();

      if (position === undefined) {
        continue;
      }

      for (const term of this.place(doc, position)) {
        newTerms.add(term);
      }
    }
    this.materialize();
    return [...newTerms];
  }

  public update(updates: readonly TermUpdate<Doc>[]): TermDelta {
    this.hydrate();
    const touched = updates.reduce((acc, { oldTerms, newTerms }) => acc.union(oldTerms.symmetricDifference(newTerms)), new Set<string>());
    const preexisting = touched.intersection(this.positionsByTerm);

    this.rePointAll(updates);
    const added = [...touched].filter(term => this.positionsByTerm.has(term) && !preexisting.has(term));
    const removed = [...preexisting].filter(term => !this.positionsByTerm.has(term));

    this.materialize();
    return { added, removed };
  }

  public positionalDocs(): readonly Doc[] {
    return this.docs;
  }

  public indexedTerms(): string[] {
    return [...this.densePostings.keys(), ...this.sparsePostings.terms()];
  }

  public termsForDoc(doc: Doc): ReadonlySet<string> {
    const position = this.positionOf.get(doc);
    const terms = new Set<string>();

    if (position === undefined) {
      return terms;
    }

    for (const term of this.indexedTerms()) {
      if (this.postingFor(term)?.has(position) === true) {
        terms.add(term);
      }
    }
    return terms;
  }

  public postingFor(term: string): Posting | undefined {
    const dense = this.densePostings.get(term);

    if (dense !== undefined) {
      return dense;
    }
    const sparse = this.sparsePostings.slice(term);
    return sparse === undefined ? undefined : new SparsePosting(sparse);
  }

  public universe(): BitSet {
    return this.all.clone();
  }

  public emptyBitSet(): BitSet {
    return new BitSet(this.capacity);
  }

  public bitSetFrom(posting: Posting): BitSet {
    const bitSet = this.emptyBitSet();

    posting.orInto(bitSet);
    return bitSet;
  }

  public complementOf(bitset: BitSet): BitSet {
    const universe = this.universe();

    universe.andNotInPlace(bitset);
    return universe;
  }

  public complementOfDocs(docs: readonly Doc[], filter?: BitSet): Doc[] {
    const excluded = this.emptyBitSet();

    for (const doc of docs) {
      const position = this.positionOf.get(doc);

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

  public unionOfPostings(postings: readonly Posting[]): BitSet {
    const union = new BitSet(this.capacity);

    for (const posting of postings) {
      posting.orInto(union);
    }
    return union;
  }

  public docsFrom(bitset: BitSet): Doc[] {
    return bitset.gather(this.docs);
  }

  private place(doc: Doc, position: number): string[] {
    this.docs[position] = doc;
    this.positionOf.set(doc, position);
    this.all.set(position);
    this.liveCount += 1;
    const newTerms: string[] = [];

    for (const term of this.termsFor(doc)) {
      const positions = this.positionsByTerm.get(term);

      if (positions === undefined) {
        this.positionsByTerm.set(term, [position]);
        newTerms.push(term);
      } else {
        insertSorted(positions, position);
      }
    }
    return newTerms;
  }

  private ensureCapacity(required: number): void {
    if (required < this.capacity) {
      return;
    }
    const live: Doc[] = [];

    for (const doc of this.docs) {
      if (doc !== undefined) {
        live.push(doc);
      }
    }
    this.build(live, required);
  }

  private rePointAll(updates: readonly TermUpdate<Doc>[]): void {
    for (const { doc, oldTerms, newTerms } of updates) {
      const position = this.positionOf.get(doc);

      if (position === undefined) {
        continue;
      }
      this.rePoint(position, oldTerms.difference(newTerms), newTerms.difference(oldTerms));
    }
  }

  private rePoint(position: number, removedTerms: ReadonlySet<string>, addedTerms: ReadonlySet<string>): void {
    for (const term of removedTerms) {
      const positions = this.positionsByTerm.get(term);

      if (positions === undefined) {
        continue;
      }
      removeValue(positions, position);

      if (positions.length === 0) {
        this.positionsByTerm.delete(term);
      }
    }

    for (const term of addedTerms) {
      const positions = this.positionsByTerm.get(term);

      if (positions === undefined) {
        this.positionsByTerm.set(term, [position]);
      } else {
        insertSorted(positions, position);
      }
    }
  }

  private denseThreshold(): number {
    return Math.ceil(this.capacity / 32);
  }

  private materialize(): void {
    const threshold = this.denseThreshold();

    this.materializeDense(threshold);
    this.materializeSparse(threshold);
    this.positionsByTerm = new Map<string, number[]>();
    this.positionsDropped = true;
  }

  private hydrate(): void {
    if (!this.positionsDropped) {
      return;
    }
    this.positionsByTerm = new Map<string, number[]>();

    for (const [term, posting] of this.densePostings) {
      this.positionsByTerm.set(term, posting.positions());
    }

    for (const term of this.sparsePostings.terms()) {
      this.positionsByTerm.set(term, Array.from(this.sparsePostings.slice(term) as Int32Array));
    }
    this.positionsDropped = false;
  }

  private materializeDense(threshold: number): void {
    this.densePostings = new Map<string, DensePosting>();

    for (const [term, positions] of this.positionsByTerm) {
      if (positions.length > threshold) {
        const bits = new BitSet(this.capacity);

        for (const position of positions) {
          bits.set(position);
        }
        this.densePostings.set(term, new DensePosting(bits));
      }
    }
  }

  private materializeSparse(threshold: number): void {
    this.sparsePostings.build(this.positionsByTerm, length => length <= threshold);
  }

}

function capacityFor(size: number): number {
  let capacity = MIN_CAPACITY;

  while (capacity <= size) {
    capacity *= 2;
  }
  return capacity;
}
