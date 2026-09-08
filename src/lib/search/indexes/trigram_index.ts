import { identity } from "@/utils/pure/function";
import { intersectByKey } from "@/utils/pure/map";
import { trigramsOf } from "@/utils/pure/string";

export class TrigramIndex<T = string> {
  private readonly itemsByTrigram: Map<string, Map<string, T>> = new Map<string, Map<string, T>>();
  private readonly keyOf: (item: T) => string;

  constructor(items: T[], keyOf: (item: T) => string = identity as (item: T) => string) {
    this.keyOf = keyOf;

    for (const item of items) {
      this.add(item);
    }
  }

  public matching(fragment: string, corpus: T[]): T[] {
    return fragment.length < 3 ? corpus : [...this.candidates(fragment).values()];
  }

  public matchingAll(fragments: string[], corpus: T[]): T[] {
    const narrowing = fragments.filter(fragment => fragment.length >= 3);
    return narrowing.length === 0 ? corpus : [...this.candidatesOfAll(narrowing).values()];
  }

  public add(item: T): void {
    const key = this.keyOf(item);

    for (const trigram of trigramsOf(key)) {
      let items = this.itemsByTrigram.get(trigram);

      if (items === undefined) {
        items = new Map<string, T>();
        this.itemsByTrigram.set(trigram, items);
      }
      items.set(key, item);
    }
  }

  public remove(item: T): void {
    const key = this.keyOf(item);

    for (const trigram of trigramsOf(key)) {
      const items = this.itemsByTrigram.get(trigram);

      if (items === undefined) {
        continue;
      }
      items.delete(key);

      if (items.size === 0) {
        this.itemsByTrigram.delete(trigram);
      }
    }
  }

  private candidates(fragment: string): Map<string, T> {
    let candidates: Map<string, T> | null = null;

    for (const trigram of trigramsOf(fragment)) {
      const items = this.itemsByTrigram.get(trigram);

      if (items === undefined) {
        return new Map<string, T>();
      }
      candidates = candidates === null ? items : intersectByKey(items, candidates);

      if (candidates.size === 0) {
        return candidates;
      }
    }
    return candidates ?? new Map<string, T>();
  }

  private candidatesOfAll(fragments: string[]): Map<string, T> {
    let candidates: Map<string, T> | null = null;

    for (const fragment of fragments) {
      const forFragment = this.candidates(fragment);

      candidates = candidates === null ? forFragment : intersectByKey(forFragment, candidates);

      if (candidates.size === 0) {
        return candidates;
      }
    }
    return candidates ?? new Map<string, T>();
  }
}
