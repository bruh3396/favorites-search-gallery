import { DensePosting, Posting, SparsePosting } from "@/lib/search/engine/bitmap/bits/posting";
import { BitSet } from "@/lib/search/engine/bitmap/bits/bitset";
import { findFirstIndexWhere } from "@/utils/pure/array";

const MIN_CAPACITY = 64;

export class BitmapIndex<Doc> {
  private docs: Doc[] = [];
  private positionsByTerm: Map<string, number[]> = new Map<string, number[]>();
  private positionOf: Map<Doc, number> = new Map<Doc, number>();
  private freeList: number[] = [];
  private liveCount = 0;
  private capacity = 0;
  private postings: Map<string, Posting> = new Map<string, Posting>();
  private all: BitSet = new BitSet(0);

  constructor(private readonly extractTerms: (doc: Doc) => Iterable<string>) { }

  public get size(): number {
    return this.liveCount;
  }

  public get width(): number {
    return this.capacity;
  }

  private get denseThreshold(): number {
    return Math.ceil(this.capacity / 32);
  }

  public build(docs: readonly Doc[]): void {
    this.capacity = capacityFor(docs.length);
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
    this.postings = this.materializeAll();
  }

  public add(doc: Doc): string[] {
    if (this.positionOf.has(doc)) {
      return [];
    }

    if (this.freeList.length === 0) {
      this.grow();
    }
    const position = this.freeList.pop() as number;

    this.place(doc, position);

    const affectedTerms = [...new Set(this.termsOf(doc))];

    for (const term of affectedTerms) {
      this.reMaterialize(term);
    }
    return affectedTerms;
  }

  public remove(doc: Doc): string[] {
    const position = this.positionOf.get(doc);

    if (position === undefined) {
      return [];
    }
    const affectedTerms = [...new Set(this.termsOf(doc))];

    for (const term of affectedTerms) {
      const positions = this.positionsByTerm.get(term);

      if (positions !== undefined) {
        removeValue(positions, position);

        if (positions.length === 0) {
          this.positionsByTerm.delete(term);
        }
      }
    }
    this.all.remove(position);
    this.positionOf.delete(doc);
    this.docs[position] = undefined as unknown as Doc;
    this.freeList.push(position);
    this.liveCount -= 1;

    for (const term of affectedTerms) {
      this.reMaterialize(term);
    }
    return affectedTerms;
  }

  public positionalDocs(): readonly (Doc | undefined)[] {
    return this.docs;
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

  public allDocs(): Doc[] {
    return this.docsFrom(this.all);
  }

  public emptyBitSet(): BitSet {
    return new BitSet(this.capacity);
  }

  public unionOfPostings(postings: readonly Posting[]): BitSet {
    const union = new BitSet(this.capacity);

    for (const posting of postings) {
      posting.orInto(union);
    }
    return union;
  }

  public postingEntries(): { term: string; posting: Posting }[] {
    const entries: { term: string; posting: Posting }[] = [];

    for (const [term, posting] of this.postings) {
      entries.push({ term, posting });
    }
    return entries;
  }

  public orTermInto(accumulator: BitSet, term: string): void {
    this.postings.get(term)?.orInto(accumulator);
  }

  public docAt(position: number): Doc {
    return this.docs[position];
  }

  public docsFrom(bitset: BitSet): Doc[] {
    return bitset.gather(this.docs);
  }

  private place(doc: Doc, position: number): void {
    this.docs[position] = doc;
    this.positionOf.set(doc, position);
    this.all.add(position);
    this.liveCount += 1;

    for (const term of this.termsOf(doc)) {
      const positions = this.positionsByTerm.get(term);

      if (positions === undefined) {
        this.positionsByTerm.set(term, [position]);
      } else {
        insertSorted(positions, position);
      }
    }
  }

  private grow(): void {
    const live: Doc[] = [];

    for (const doc of this.docs) {
      if (doc !== undefined) {
        live.push(doc);
      }
    }
    this.build(live);
  }

  private termsOf(doc: Doc): Iterable<string> {
    return this.extractTerms(doc);
  }

  private materializeAll(): Map<string, Posting> {
    const postings = new Map<string, Posting>();

    for (const term of this.positionsByTerm.keys()) {
      postings.set(term, this.postingFor(term));
    }
    return postings;
  }

  private reMaterialize(term: string): void {
    if (this.positionsByTerm.has(term)) {
      this.postings.set(term, this.postingFor(term));
    } else {
      this.postings.delete(term);
    }
  }

  private postingFor(term: string): Posting {
    const positions = this.positionsByTerm.get(term) ?? [];

    if (positions.length > this.denseThreshold) {
      const bits = new BitSet(this.capacity);

      for (const position of positions) {
        bits.add(position);
      }
      return new DensePosting(bits);
    }
    return new SparsePosting(Int32Array.from(positions));
  }
}

function capacityFor(size: number): number {
  let capacity = MIN_CAPACITY;

  while (capacity <= size) {
    capacity *= 2;
  }
  return capacity;
}

function insertSorted(sorted: number[], value: number): void {
  sorted.splice(findFirstIndexWhere(sorted.length, index => sorted[index] >= value), 0, value);
}

function removeValue(sorted: number[], value: number): void {
  const index = sorted.indexOf(value);

  if (index !== -1) {
    sorted.splice(index, 1);
  }
}
