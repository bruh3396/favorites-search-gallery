import { TermDelta, TermUpdate } from "@/lib/search/search_engine";
import { SortedArray } from "@/lib/collections/sorted_array";

export class InvertedIndex<Doc> {
  private readonly terms: SortedArray<string> = new SortedArray<string>();
  private readonly docs: Set<Doc> = new Set<Doc>();
  private readonly docsByTerm: Map<string, Set<Doc>> = new Map<string, Set<Doc>>();

  constructor(
    private readonly extractTerms: (doc: Doc) => Iterable<string>,
    private maintainingSortOrder: boolean = true
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

  public addDocs(docs: Doc[]): void {
    this.maintainingSortOrder = false;
    docs.forEach(doc => this.addDoc(doc));
    this.maintainingSortOrder = true;
    this.terms.sort();
  }

  public addDoc(doc: Doc): string[] {
    this.docs.add(doc);
    const newTerms: string[] = [];

    for (const term of this.extractTerms(doc)) {
      let docs = this.docsByTerm.get(term);

      if (docs === undefined) {
        docs = new Set<Doc>();
        this.docsByTerm.set(term, docs);
        this.addTerm(term);
        newTerms.push(term);
      }
      docs.add(doc);
    }
    return newTerms;
  }

  public updateDocs(updates: readonly TermUpdate<Doc>[]): TermDelta {
    const added: string[] = [];
    const removed: string[] = [];

    for (const { doc, oldTerms, newTerms } of updates) {
      this.docs.add(doc);

      for (const term of oldTerms.difference(newTerms)) {
        const docs = this.docsByTerm.get(term);

        if (docs === undefined) {
          continue;
        }
        docs.delete(doc);

        if (docs.size === 0) {
          this.docsByTerm.delete(term);
          this.terms.remove(term);
          removed.push(term);
        }
      }

      for (const term of newTerms.difference(oldTerms)) {
        let docs = this.docsByTerm.get(term);

        if (docs === undefined) {
          docs = new Set<Doc>();
          this.docsByTerm.set(term, docs);
          this.addTerm(term);
          added.push(term);
        }
        docs.add(doc);
      }
    }
    return { added, removed };
  }

  public removeDoc(doc: Doc): string[] {
    this.docs.delete(doc);
    const deadTerms: string[] = [];

    for (const term of this.extractTerms(doc)) {
      const docs = this.docsByTerm.get(term);

      if (docs === undefined) {
        continue;
      }
      docs.delete(doc);

      if (docs.size === 0) {
        this.docsByTerm.delete(term);
        this.terms.remove(term);
        deadTerms.push(term);
      }
    }
    return deadTerms;
  }

  private addTerm(term: string): void {
    if (this.maintainingSortOrder) {
      this.terms.insert(term);
    } else {
      this.terms.push(term);
    }
  }
}
