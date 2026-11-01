import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";
import { StringInterner } from "@/core/utils/string/string_interner";
import { WildcardResolver } from "@/core/domain/search/indexes/wildcard_resolver";

export interface WildcardDocResolverDependencies<Doc> {
  invertedIndex: InvertedIndex<Doc>;
  stringInterner: StringInterner;
}

export class WildcardDocResolver<Doc> extends WildcardResolver<ReadonlySet<Doc>> {
  private readonly invertedIndex: InvertedIndex<Doc>;

  constructor({ invertedIndex, stringInterner }: WildcardDocResolverDependencies<Doc>) {
    super(stringInterner);
    this.invertedIndex = invertedIndex;
  }

  protected combine(matches: string[]): ReadonlySet<Doc> {
    const docs = new Set<Doc>();

    for (const term of matches) {
      this.invertedIndex.docsForTerm(term)?.forEach(doc => docs.add(doc));
    }
    return docs;
  }
}
