import { KeyCodec } from "@/lib/collection/key_codec";
import { identity } from "@/utils/pure/function";
import { intersectSortedNumbers } from "@/utils/pure/array";
import { trigramsOf } from "@/utils/pure/string";

export class TrigramIndex<T = string> {
  private readonly idsByTrigram: Map<string, number[]> = new Map<string, number[]>();
  private readonly codec: KeyCodec<T>;

  constructor(items: T[], keyOf: (item: T) => string = identity as (item: T) => string) {
    this.codec = new KeyCodec<T>(keyOf);

    for (const item of items) {
      this.add(item);
    }
  }

  public matching(fragment: string, corpus: T[]): T[] {
    return fragment.length < 3 ? corpus : this.codec.decode(this.candidates(fragment));
  }

  public matchingAll(fragments: string[], corpus: T[]): T[] {
    const narrowing = fragments.filter(fragment => fragment.length >= 3);
    return narrowing.length === 0 ? corpus : this.codec.decode(this.candidatesOfAll(narrowing));
  }

  public add(item: T): void {
    const key = this.codec.keyOf(item);

    if (this.codec.hasKey(key)) {
      return;
    }
    const id = this.codec.encode(item);

    for (const trigram of trigramsOf(key)) {
      const memberIds = this.idsByTrigram.get(trigram);

      if (memberIds === undefined) {
        this.idsByTrigram.set(trigram, [id]);
      } else if (memberIds[memberIds.length - 1] !== id) {
        memberIds.push(id);
      }
    }
  }

  public remove(item: T): void {
    const key = this.codec.keyOf(item);
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
