import { TermDelta } from "@/core/domain/search/engines/term_delta";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { insertSorted, removeValue } from "@/core/utils/collection/array_utilities";
import { DurablePostings } from "@/core/domain/search/engines/bit/indexes/durable_postings";

export class DraftPostings {
  private positionsByTerm = new Map<string, number[]>();

  public reset(): void {
    this.positionsByTerm = new Map<string, number[]>();
  }

  public hydrateFrom(durablePostings: DurablePostings): void {
    this.reset();
    durablePostings.forEachPosting((term, positions) => this.positionsByTerm.set(term, positions));
  }

  public entries(): IterableIterator<[string, number[]]> {
    return this.positionsByTerm.entries();
  }

  public add(term: string, position: number): boolean {
    const positions = this.positionsByTerm.get(term);

    if (positions === undefined) {
      this.positionsByTerm.set(term, [position]);
      return true;
    }
    insertSorted(positions, position);
    return false;
  }

  public applyUpdates<Doc>(termUpdates: readonly TermUpdate<Doc>[], findPosition: (doc: Doc) => number | undefined): TermDelta {
    const touched = termUpdates.reduce((acc, { oldTerms, newTerms }) => acc.union(oldTerms.symmetricDifference(newTerms)), new Set<string>());
    const preexisting = new Set<string>([...touched].filter(term => this.positionsByTerm.has(term)));

    for (const { doc, oldTerms, newTerms } of termUpdates) {
      const position = findPosition(doc);

      if (position !== undefined) {
        this.rePoint(position, oldTerms.difference(newTerms), newTerms.difference(oldTerms));
      }
    }
    const added = [...touched].filter(term => this.positionsByTerm.has(term) && !preexisting.has(term));
    const removed = [...preexisting].filter(term => !this.positionsByTerm.has(term));
    return { added, removed };
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
      this.add(term, position);
    }
  }
}
