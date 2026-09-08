import { SortedArray } from "@/lib/collection/sorted_array";
import { compareStrings } from "@/utils/pure/string";
import { findFirstIndexWhere } from "@/utils/pure/array";
import { identity } from "@/utils/pure/function";

export class PrefixIndex<T = string> {
  private readonly items: SortedArray<T>;
  private readonly keyOf: (item: T) => string;

  constructor(items: T[], keyOf: (item: T) => string = identity as (item: T) => string) {
    this.keyOf = keyOf;
    this.items = new SortedArray<T>((a, b) => compareStrings(keyOf(a), keyOf(b)));

    for (const item of items) {
      this.items.push(item);
    }
    this.items.sort();
  }

  public all(): T[] {
    return this.items.toArray();
  }

  public matchingPrefix(prefix: string): T[] {
    const sorted = this.items.toArray();
    const result: T[] = [];
    const start = findFirstIndexWhere(sorted.length, index => this.keyOf(sorted[index]) >= prefix);

    for (let i = start; i < sorted.length; i += 1) {
      const key = this.keyOf(sorted[i]);

      if (key.startsWith(prefix)) {
        result.push(sorted[i]);
      } else if (key > prefix) {
        break;
      }
    }
    return result;
  }

  public add(item: T): void {
    this.items.insert(item);
  }

  public remove(item: T): void {
    this.items.remove(item);
  }
}
