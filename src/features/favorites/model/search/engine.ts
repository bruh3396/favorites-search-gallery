import { Favorite } from "../../../../types/favorite";
import { InvertedIndex } from "../../../../lib/core/data_structures/inverted_index";
import { SearchEngine } from "../../../../lib/search/engine/search_engine";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { yieldControl } from "../../../../lib/core/scheduling/promise";

const INDEX_BATCH_SIZE = 500;

const index = new InvertedIndex<Favorite>(favorite => favorite.tags, false);
const engine = new SearchEngine<Favorite>(index);
let state: "indexing" | "ready" = "ready";
let deferred: Favorite[] = [];

export function search(searchQuery: SearchQuery<Favorite>, candidates: Favorite[]): Favorite[] {
  const isEngineEligible = state === "ready" && !searchQuery.metadata.hasMetadataTag;
  return isEngineEligible ? engine.search(searchQuery, candidates) : searchQuery.apply(candidates);
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
  for (let i = 0; i < deferred.length; i += INDEX_BATCH_SIZE) {
    const batch = deferred.slice(i, i + INDEX_BATCH_SIZE);

    batch.forEach(doc => index.addDoc(doc));
    await yieldControl();
  }
  deferred = [];
  index.maintainSortOrder(true);
  index.sortTerms();
  state = "ready";
}
