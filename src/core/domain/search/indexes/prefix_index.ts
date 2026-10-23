import { SortedArray } from "@/core/utils/collection/sorted_array";
import { findFirstIndexWhere } from "@/core/utils/collection/array";

export class PrefixIndex {
  constructor(private readonly terms: SortedArray<string>) {}

  public termsMatchingPrefix(prefix: string): string[] {
    const sorted = this.terms.toArray();
    const result: string[] = [];
    const start = findFirstIndexWhere(sorted.length, index => sorted[index] >= prefix);

    for (let i = start; i < sorted.length && sorted[i].startsWith(prefix); i += 1) {
      result.push(sorted[i]);
    }
    return result;
  }
}
