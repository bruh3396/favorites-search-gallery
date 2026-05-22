import { Favorite } from "../../../../types/favorite";
import { FavoritesConfig } from "../../../../config/favorites_config";
import { InvertedIndex } from "../../../../lib/collection/inverted_index";
import { InvertedIndexSearcher } from "../../../../lib/search/index/inverted_index_searcher";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { yieldControl } from "../../../../lib/async/sleep";

const index = new InvertedIndex<Favorite>(favorite => favorite.tags, false);
const searcher = new InvertedIndexSearcher<Favorite>(index);
let state: "indexing" | "ready" = "ready";
let deferred: Favorite[] = [];

export function search(searchQuery: SearchQuery<Favorite>, candidates: Favorite[]): Favorite[] {
  const eligible = state === "ready" && !searchQuery.metadata.hasMetadataTerm;
  return eligible ? searcher.search(searchQuery, candidates) : searchQuery.filter(candidates);
}

export function add(doc: Favorite): void {
  if (state === "ready") {
    index.addDoc(doc);
    return;
  }

  if (deferred.length === 0) {
    Promise.resolve().then(() => finishIndexing());
  }
  deferred.push(doc);
}

export function remove(doc: Favorite): void {
  index.removeDoc(doc);
}

export function deferIndexing(): void {
  state = "indexing";
  index.maintainSortOrder(false);
}

async function finishIndexing(): Promise<void> {
  for (let i = 0; i < deferred.length; i += FavoritesConfig.searchIndexBuildBatchSize) {
    const batch = deferred.slice(i, i + FavoritesConfig.searchIndexBuildBatchSize);

    batch.forEach(doc => index.addDoc(doc));
    await yieldControl();
  }
  deferred = [];
  index.maintainSortOrder(true);
  index.sortTerms();
  state = "ready";
}
