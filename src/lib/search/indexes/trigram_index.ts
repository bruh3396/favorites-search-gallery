import { KeyedIndex } from "@/lib/collection/key_codec";
import { SortedArray } from "@/lib/collection/sorted_array";
import { intersectSortedNumbers } from "@/utils/pure/array";
import { trigramsOf } from "@/utils/pure/string";

export class TrigramIndex {
  private readonly terms: SortedArray<string>;
  private readonly idsByTrigram: Map<string, number[]> = new Map<string, number[]>();
  private readonly codec: KeyedIndex<string>;

  constructor(terms: SortedArray<string>) {
    this.codec = new KeyedIndex<string>(s => s);
    this.terms = terms;

    for (const term of terms.toArray()) {
      this.add(term);
    }
  }

  public termsMatching(fragment: string): string[] {
    return fragment.length < 3 ? this.terms.toArray() : this.codec.decode(this.candidates(fragment));
  }

  public termsMatchingAll(fragments: string[]): string[] {
    const narrowing = fragments.filter(fragment => fragment.length >= 3);
    return narrowing.length === 0 ? this.terms.toArray() : this.codec.decode(this.candidatesOfAll(narrowing));
  }

  public add(term: string): void {
    const key = this.codec.keyOf(term);

    if (this.codec.hasKey(key)) {
      return;
    }
    const id = this.codec.encode(term);

    for (const trigram of trigramsOf(key)) {
      const memberIds = this.idsByTrigram.get(trigram);

      if (memberIds === undefined) {
        this.idsByTrigram.set(trigram, [id]);
      } else if (memberIds[memberIds.length - 1] !== id) {
        memberIds.push(id);
      }
    }
  }

  public remove(term: string): void {
    const key = this.codec.keyOf(term);
    const id = this.codec.forget(key);

    if (id === undefined) {
      return;
    }

    for (const trigram of trigramsOf(key)) {
      const ids = this.idsByTrigram.get(trigram);

      if (ids === undefined) {
        continue;
      }
      const at = ids.indexOf(id);

      if (at !== -1) {
        ids.splice(at, 1);
      }

      if (ids.length === 0) {
        this.idsByTrigram.delete(trigram);
      }
    }
  }

  private candidates(fragment: string): number[] {
    let candidates: number[] | null = null;

    for (const trigram of trigramsOf(fragment)) {
      const memberIds = this.idsByTrigram.get(trigram);

      if (memberIds === undefined) {
        return [];
      }
      candidates = candidates === null ? memberIds : intersectSortedNumbers(candidates, memberIds);

      if (candidates.length === 0) {
        return candidates;
      }
    }
    return candidates ?? [];
  }

  private candidatesOfAll(fragments: string[]): number[] {
    let candidates: number[] | null = null;

    for (const fragment of fragments) {
      const forFragment = this.candidates(fragment);

      candidates = candidates === null ? forFragment : intersectSortedNumbers(candidates, forFragment);

      if (candidates.length === 0) {
        return candidates;
      }
    }
    return candidates ?? [];
  }
}
