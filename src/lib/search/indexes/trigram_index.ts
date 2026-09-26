import { compareStrings, trigramsOf } from "@/utils/pure/string";
import { findFirstIndexWhere, intersectSorted } from "@/utils/pure/array";
import { SortedArray } from "@/lib/collection/sorted_array";
import { internString } from "@/lib/search/interner";

export class TrigramIndex {
  private readonly terms: SortedArray<string>;
  private readonly termsByTrigram: Map<string, string[]> = new Map<string, string[]>();

  constructor(terms: SortedArray<string>) {
    this.terms = terms;

    for (const term of terms.toArray()) {
      this.add(term);
    }
  }

  public termsMatching(fragment: string): string[] {
    return fragment.length < 3 ? this.terms.toArray() : this.candidatesOf(fragment);
  }

  public termsMatchingAll(fragments: string[]): string[] {
    const narrowing = fragments.filter(fragment => fragment.length >= 3);
    return narrowing.length === 0 ? this.terms.toArray() : this.candidatesOfAll(narrowing);
  }

  public add(term: string): void {
    const shared = internString(term);

    for (const trigram of trigramsOf(shared)) {
      const key = internString(trigram);
      const bucket = this.termsByTrigram.get(key);

      if (bucket === undefined) {
        this.termsByTrigram.set(key, [shared]);
      } else {
        this.insertIntoBucket(bucket, shared);
      }
    }
  }

  public remove(term: string): void {
    for (const trigram of trigramsOf(term)) {
      const bucket = this.termsByTrigram.get(trigram);

      if (bucket === undefined) {
        continue;
      }
      const at = this.indexInBucket(bucket, term);

      if (at !== -1) {
        bucket.splice(at, 1);
      }

      if (bucket.length === 0) {
        this.termsByTrigram.delete(trigram);
      }
    }
  }

  private candidatesOf(fragment: string): string[] {
    return this.intersectAll(trigramsOf(fragment), trigram => this.termsByTrigram.get(trigram) ?? []);
  }

  private candidatesOfAll(fragments: string[]): string[] {
    return this.intersectAll(fragments, fragment => this.candidatesOf(fragment));
  }

  private intersectAll<T>(sources: readonly T[], candidatesFor: (source: T) => string[]): string[] {
    let candidates = candidatesFor(sources[0]);

    for (let i = 1; i < sources.length && candidates.length > 0; i += 1) {
      candidates = intersectSorted(candidates, candidatesFor(sources[i]), compareStrings);
    }
    return candidates;
  }

  private insertIntoBucket(bucket: string[], term: string): void {
    const at = findFirstIndexWhere(bucket.length, index => compareStrings(bucket[index], term) >= 0);

    if (at < bucket.length && bucket[at] === term) {
      return;
    }
    bucket.splice(at, 0, term);
  }

  private indexInBucket(bucket: string[], term: string): number {
    const at = findFirstIndexWhere(bucket.length, index => compareStrings(bucket[index], term) >= 0);
    return at < bucket.length && bucket[at] === term ? at : -1;
  }
}
