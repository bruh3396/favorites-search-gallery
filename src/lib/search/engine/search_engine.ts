import { IndexedSearcher } from "@/lib/search/engine/indexed_searcher";
import { IndexedWildcardResolver } from "@/lib/search/engine/wildcard/resolver";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { Searchable } from "@/types/search";
import { WildcardExpander } from "@/lib/search/engine/wildcard/expander";
import { hasMetadataTerm } from "@/lib/search/parsers/search_term_parser";

export class SearchEngine<T extends Searchable> {
  private readonly invertedIndex: InvertedIndex<T>;
  private readonly resolver = new IndexedWildcardResolver();
  private readonly searcher: IndexedSearcher<T>;

  constructor(getTerms: (doc: T) => Iterable<string>, docs: T[] = []) {
    this.invertedIndex = new InvertedIndex<T>(getTerms);
    this.searcher = new IndexedSearcher<T>(this.invertedIndex, new WildcardExpander(this.resolver));
    this.index(docs);
  }

  public search(query: string, candidates: T[]): T[] {
    return hasMetadataTerm(query) ? new SearchQuery<T>(query).filter(candidates) : this.searcher.search(query, candidates);
  }

  public index(docs: T[]): void {
    this.invertedIndex.addDocs(docs);
    this.resolver.index(this.invertedIndex.indexedTerms());
  }

  public add(doc: T): void {
    this.invertedIndex.addDoc(doc).forEach(term => this.resolver.addTerm(term));
  }

  public remove(doc: T): void {
    this.invertedIndex.removeDoc(doc).forEach(term => this.resolver.removeTerm(term));
  }
}
