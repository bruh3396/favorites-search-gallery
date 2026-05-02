import { SortedArray } from "./sorted_array";

export class InvertedIndex<Doc> {
  private readonly indexedTerms: SortedArray<string> = new SortedArray<string>();
  private readonly indexedDocs: Set<Doc> = new Set<Doc>();
  private readonly docsByTerm: Map<string, Set<Doc>> = new Map<string, Set<Doc>>();

  constructor(private readonly extractTerms: (doc: Doc) => Iterable<string>, private maintainingSortOrder: boolean = false) { }

  public getIndexedTerms(): string[] {
    return this.indexedTerms.toArray();
  }

  public getDocsForTerm(term: string): Set<Doc> | undefined {
    return this.docsByTerm.get(term);
  }

  public getAllDocs(): Set<Doc> {
    return this.indexedDocs;
  }

  public addDoc(doc: Doc): void {
    this.indexedDocs.add(doc);

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
    this.indexedDocs.delete(doc);

    for (const term of this.extractTerms(doc)) {
      this.docsByTerm.get(term)?.delete(doc);
    }
  }

  public maintainSortOrder(value: boolean): void {
    this.maintainingSortOrder = value;
  }

  public sortTerms(): void {
    this.indexedTerms.sort();
  }

  private addTerm(term: string): void {
    if (this.maintainingSortOrder) {
      this.indexedTerms.insert(term);
    } else {
      this.indexedTerms.push(term);
    }
  }
}
