import { TermDelta, TermUpdate } from "@/lib/search/engines/search_engine";
import { BitAlgebra } from "@/lib/search/engines/bit/indexes/bit_algebra";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { DocTable } from "@/lib/search/engines/bit/indexes/doc_table";
import { DraftPostings } from "@/lib/search/engines/bit/indexes/draft_postings";
import { DurablePostings } from "@/lib/search/engines/bit/indexes/durable_postings";
import { Posting } from "@/lib/search/engines/bit/postings/posting";
import { internString } from "@/lib/search/interner";

export class BitIndex<Doc> {
  private readonly docs = new DocTable<Doc>();
  private readonly algebra = new BitAlgebra<Doc>(this.docs);
  private readonly draft = new DraftPostings();
  private readonly postings = new DurablePostings();

  constructor(private readonly termsFor: (doc: Doc) => Iterable<string>) { }

  public get size(): number {
    return this.docs.size;
  }

  public get width(): number {
    return this.docs.width;
  }

  public universe(): BitSet {
    return this.algebra.universe();
  }

  public empty(): BitSet {
    return this.algebra.empty();
  }

  public docsFrom(bitset: BitSet): Doc[] {
    return this.algebra.docsFrom(bitset);
  }

  public bitSetFrom(posting: Posting): BitSet {
    return this.algebra.bitSetFrom(posting);
  }

  public complementOf(bitset: BitSet): BitSet {
    return this.algebra.complementOf(bitset);
  }

  public docComplementOf(docs: readonly Doc[], filter?: BitSet): Doc[] {
    return this.algebra.docComplementOf(docs, filter);
  }

  public unionOf(postings: readonly Posting[]): BitSet {
    return this.algebra.unionOf(postings);
  }

  public allDocs(): readonly Doc[] {
    return this.docs.allDocs();
  }

  public build(docs: readonly Doc[], minCapacity: number = docs.length): void {
    this.docs.reset(docs.length, minCapacity);
    this.algebra.reset();
    this.draft.reset();

    for (let position = 0; position < docs.length; position += 1) {
      this.place(docs[position], position);
    }
    this.materialize();
  }

  public add(docs: readonly Doc[]): string[] {
    if (!this.docs.hasRoomFor(docs.length)) {
      this.build(this.docs.liveDocs(), this.docs.size + docs.length);
    }
    return this.mutate(() => {
      const newTerms = new Set<string>();
      const positions = this.docs.allocate(docs.length);

      docs.forEach((doc, i) => {
        for (const term of this.place(doc, positions[i])) {
          newTerms.add(term);
        }
      });
      return [...newTerms];
    });
  }

  public update(updates: readonly TermUpdate<Doc>[]): TermDelta {
    return this.mutate(() => this.draft.applyUpdates(updates, doc => this.docs.positionOf(doc)));
  }

  public indexedTerms(): string[] {
    return this.postings.terms();
  }

  public postingFor(term: string): Posting | undefined {
    return this.postings.postingFor(term);
  }

  private place(doc: Doc, position: number): string[] {
    this.docs.place(doc, position);
    this.algebra.occupy(position);
    const newTerms: string[] = [];

    for (const term of this.termsFor(doc)) {
      if (this.draft.add(internString(term), position)) {
        newTerms.push(term);
      }
    }
    return newTerms;
  }

  private mutate<T>(apply: () => T): T {
    this.draft.hydrateFrom(this.postings);
    const result = apply();

    this.materialize();
    return result;
  }

  private materialize(): void {
    this.postings.materializeFrom(this.draft.entries(), this.docs.width);
    this.draft.reset();
  }
}
