import { SortedArray } from "@/lib/collection/sorted_array";

export class InvertedIndex<Doc> {
  private readonly terms: SortedArray<string> = new SortedArray<string>();
  private readonly docs: Set<Doc> = new Set<Doc>();
  private readonly docsByTerm: Map<string, Set<Doc>> = new Map<string, Set<Doc>>();

  constructor(
    private readonly extractTerms: (doc: Doc) => Iterable<string>,
    private maintainingSortOrder: boolean = false
  ) { }

  public indexedTerms(): string[] {
    return this.terms.toArray();
  }

  public docsForTerm(term: string): Set<Doc> | undefined {
    return this.docsByTerm.get(term);
  }

  public allDocs(): ReadonlySet<Doc> {
    return this.docs;
  }

  public addDoc(doc: Doc): void {
    this.docs.add(doc);

    for (const term of this.extractTerms(doc)) {
      let docs = this.docsByTerm.get(term);

      if (docs === undefined) {
        docs = new Set<Doc>();
        this.docsByTerm.set(term, docs);
        this.addTerm(term);
      }
      docs.add(doc);
    }
  }

  public removeDoc(doc: Doc): void {
    this.docs.delete(doc);

    for (const term of this.extractTerms(doc)) {
      const docs = this.docsByTerm.get(term);

      if (docs === undefined) {
        continue;
      }
      docs.delete(doc);

      if (docs.size === 0) {
        this.docsByTerm.delete(term);
        this.terms.remove(term);
      }
    }
  }

  public maintainSortOrder(value: boolean): void {
    this.maintainingSortOrder = value;
  }

  public sortTerms(): void {
    this.terms.sort();
  }

  private addTerm(term: string): void {
    if (this.maintainingSortOrder) {
      this.terms.insert(term);
    } else {
      this.terms.push(term);
    }
  }
}
