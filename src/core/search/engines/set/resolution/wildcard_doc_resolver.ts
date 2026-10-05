import { InvertedIndex } from "@/core/search/engines/set/indexes/inverted_index";
import { WildcardResolver } from "@/core/search/indexes/wildcard_resolver";

export class WildcardDocResolver<Doc> extends WildcardResolver<ReadonlySet<Doc>> {
  constructor(private readonly termIndex: InvertedIndex<Doc>) {
    super();
  }

  protected combine(matches: string[]): ReadonlySet<Doc> {
    const docs = new Set<Doc>();

    for (const term of matches) {
      this.termIndex.docsForTerm(term)?.forEach(doc => docs.add(doc));
    }
    return docs;
  }
}
