import { SortedArray } from "@/lib/collection/sorted_array";
import { findFirstIndexWhere } from "@/utils/pure/array";

export class PrefixIndex {
  constructor(private readonly terms: SortedArray<string>) {}

  public termsMatchingPrefix(prefix: string): string[] {
    const sorted = this.terms.toArray();
    const result: string[] = [];
    const start = findFirstIndexWhere(sorted.length, index => sorted[index] >= prefix);

    for (let i = start; i < sorted.length; i += 1) {
      const key = sorted[i];

      if (key.startsWith(prefix)) {
        result.push(sorted[i]);
      } else if (key > prefix) {
        break;
      }
    }
    return result;
  }
}
