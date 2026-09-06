import { SortedArray } from "@/lib/collection/sorted_array";
import { lowerBound } from "@/utils/pure/array";

export class PrefixIndex {
  private readonly terms: SortedArray<string> = new SortedArray<string>();

  constructor(sortedTerms: string[]) {
    for (const term of sortedTerms) {
      this.terms.push(term);
    }
    this.terms.sort();
  }

  public allTerms(): string[] {
    return this.terms.toArray();
  }

  public termsStartingWith(prefix: string): string[] {
    const sortedTerms = this.terms.toArray();
    const result: string[] = [];

    for (let i = lowerBound(sortedTerms.length, index => sortedTerms[index] >= prefix); i < sortedTerms.length; i += 1) {
      if (sortedTerms[i].startsWith(prefix)) {
        result.push(sortedTerms[i]);
      } else if (sortedTerms[i] > prefix) {
        break;
      }
    }
    return result;
  }

  public addTerm(term: string): void {
    this.terms.insert(term);
  }

  public removeTerm(term: string): void {
    this.terms.remove(term);
  }
}
