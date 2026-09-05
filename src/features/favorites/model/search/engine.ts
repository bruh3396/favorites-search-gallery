import { Favorite } from "@/types/favorite";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { InvertedIndexSearcher } from "@/lib/search/inverted_index_searcher";
import { SearchQuery } from "@/lib/search/query/search_query";
import { hasMetadataTerm } from "@/lib/search/parsers/search_term_parser";
import { queueMacroTask } from "@/lib/async/scheduling";

const index = new InvertedIndex<Favorite>(favorite => favorite.tags);
const searcher = new InvertedIndexSearcher<Favorite>(index);
let state: "indexing" | "ready" = "ready";
let deferred: Favorite[] = [];

export function search(query: string, candidates: Favorite[]): Favorite[] {
  return canUseIndex(query) ? searcher.search(query, candidates) : new SearchQuery<Favorite>(query).filter(candidates);
}

function canUseIndex(query: string): boolean {
  return state === "ready" && !hasMetadataTerm(query);
}

export function add(doc: Favorite): void {
  if (state === "ready") {
    index.addDoc(doc);
    return;
  }
  deferred.push(doc);
}

export function remove(doc: Favorite): void {
  index.removeDoc(doc);
}

export function deferIndexing(): void {
  state = "indexing";
  index.maintainSortOrder(false);
  queueMacroTask(() => indexSync());
}

function indexSync(): void {
  deferred.forEach(doc => index.addDoc(doc));
  finishIndexing();
}

function finishIndexing(): void {
  deferred = [];
  index.maintainSortOrder(true);
  index.sortTerms();
  state = "ready";
}
