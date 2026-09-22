import { TermDelta, TermUpdate } from "@/lib/search/engines/search_engine";
import { insertSorted, removeValue } from "@/utils/pure/array";
import { DurablePostings } from "@/lib/search/engines/bit/indexes/durable_postings";

export class DraftPostings {
  private positionsByTerm = new Map<string, number[]>();
  private stale = false;

  public reset(): void {
    this.positionsByTerm = new Map<string, number[]>();
    this.stale = true;
  }

  public ensureFresh(source: DurablePostings): void {
    if (this.stale) {
      this.hydrateFrom(source);
    }
  }

  public entries(): IterableIterator<[string, number[]]> {
    return this.positionsByTerm.entries();
  }

  public add(term: string, position: number): boolean {
    this.stale = false;
    const positions = this.positionsByTerm.get(term);

    if (positions === undefined) {
      this.positionsByTerm.set(term, [position]);
      return true;
    }
    insertSorted(positions, position);
    return false;
  }

  public applyUpdates<Doc>(updates: readonly TermUpdate<Doc>[], positionOf: (doc: Doc) => number | undefined): TermDelta {
    const touched = updates.reduce((acc, { oldTerms, newTerms }) => acc.union(oldTerms.symmetricDifference(newTerms)), new Set<string>());
    const preexisting = new Set<string>([...touched].filter(term => this.positionsByTerm.has(term)));

    for (const { doc, oldTerms, newTerms } of updates) {
      const position = positionOf(doc);

      if (position !== undefined) {
        this.rePoint(position, oldTerms.difference(newTerms), newTerms.difference(oldTerms));
      }
    }
    const added = [...touched].filter(term => this.positionsByTerm.has(term) && !preexisting.has(term));
    const removed = [...preexisting].filter(term => !this.positionsByTerm.has(term));
    return { added, removed };
  }

  private hydrateFrom(source: DurablePostings): void {
    this.reset();
    source.forEachPosting((term, positions) => this.positionsByTerm.set(term, positions));
    this.stale = false;
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
