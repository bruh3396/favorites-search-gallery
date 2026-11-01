import { TermDelta } from "@/core/domain/search/engines/term_delta";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { BitAlgebra } from "@/core/domain/search/engines/bit/indexes/bit_algebra";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { DocTable } from "@/core/domain/search/engines/bit/indexes/doc_table";
import { DraftPostings } from "@/core/domain/search/engines/bit/indexes/draft_postings";
import { DurablePostings } from "@/core/domain/search/engines/bit/indexes/durable_postings";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";
import { StringInterner } from "@/core/utils/string/string_interner";

export interface BitIndexDependencies<Doc> {
  getTerms: (doc: Doc) => Iterable<string>;
  stringInterner: StringInterner;
}

export class BitIndex<Doc> {
  private readonly docTable = new DocTable<Doc>();
  private readonly algebra = new BitAlgebra<Doc>(this.docTable);
  private readonly draftPostings = new DraftPostings();
  private readonly durablePostings = new DurablePostings();

  constructor(private readonly dependencies: BitIndexDependencies<Doc>) { }

  public get size(): number {
    return this.docTable.size;
  }

  public get width(): number {
    return this.docTable.width;
  }

  public universe(): BitSet {
    return this.algebra.universe();
  }

  public empty(): BitSet {
    return this.algebra.empty();
  }

  public docsFrom(bitSet: BitSet): readonly Doc[] {
    return this.algebra.docsFrom(bitSet);
  }

  public bitSetFrom(posting: Posting): BitSet {
    return this.algebra.bitSetFrom(posting);
  }

  public complementOf(bitSet: BitSet): BitSet {
    return this.algebra.complementOf(bitSet);
  }

  public unionOf(postings: readonly Posting[]): BitSet {
    return this.algebra.unionOf(postings);
  }

  public allDocs(): readonly Doc[] {
    return this.docTable.allDocs();
  }

  public build(docs: readonly Doc[], minCapacity: number = docs.length): void {
    this.docTable.reset(docs.length, minCapacity);
    this.algebra.reset();
    this.draftPostings.reset();

    for (let position = 0; position < docs.length; position += 1) {
      this.place(docs[position], position);
    }
    this.materialize();
  }

  public add(docs: readonly Doc[]): string[] {
    if (!this.docTable.canFit(docs.length)) {
      this.build(this.docTable.liveDocs(), this.docTable.size + docs.length);
    }
    return this.mutate(() => {
      const newTerms = new Set<string>();
      const positions = this.docTable.allocate(docs.length);

      docs.forEach((doc, i) => {
        for (const term of this.place(doc, positions[i])) {
          newTerms.add(term);
        }
      });
      return [...newTerms];
    });
  }

  public update(termUpdates: readonly TermUpdate<Doc>[]): TermDelta {
    return this.mutate(() => this.draftPostings.applyUpdates(termUpdates, doc => this.docTable.findPosition(doc)));
  }

  public indexedTerms(): string[] {
    return this.durablePostings.terms();
  }

  public findPosting(term: string): Posting | undefined {
    return this.durablePostings.findPosting(term);
  }

  private place(doc: Doc, position: number): string[] {
    this.docTable.place(doc, position);
    this.algebra.occupy(position);
    const newTerms: string[] = [];

    for (const term of this.dependencies.getTerms(doc)) {
      if (this.draftPostings.add(this.dependencies.stringInterner.intern(term), position)) {
        newTerms.push(term);
      }
    }
    return newTerms;
  }

  private mutate<T>(apply: () => T): T {
    this.draftPostings.hydrateFrom(this.durablePostings);
    const result = apply();

    this.materialize();
    return result;
  }

  private materialize(): void {
    this.durablePostings.materializeFrom(this.draftPostings.entries(), this.docTable.width);
    this.draftPostings.reset();
  }
}
