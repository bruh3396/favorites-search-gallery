import { Favorite } from "../../../../types/favorite";
import { InvertedIndex } from "../../../../lib/core/data_structures/inverted_index";
import { SearchEngine } from "../../../../lib/search/engine/search_engine";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { yieldControl } from "../../../../lib/core/scheduling/promise";

export class FavoriteIndex {
  private static readonly INDEX_BATCH_SIZE = 500;
  private state: "indexing" | "ready" = "ready";
  private readonly index: InvertedIndex<Favorite>;
  private readonly engine: SearchEngine<Favorite>;
  private deferred: Favorite[] = [];

  constructor() {
    this.index = new InvertedIndex<Favorite>(favorite => favorite.tags, false);
    this.engine = new SearchEngine(this.index);
  }

  public get isReady(): boolean {
    return this.state === "ready";
  }

  public search(searchQuery: SearchQuery<Favorite>, candidates: Favorite[]): Favorite[] {
    const canUseEngine = this.isReady && !searchQuery.metadata.hasMetadataTag;
    return canUseEngine ? this.engine.search(searchQuery, candidates) : searchQuery.apply(candidates);
  }

  public add(doc: Favorite): void {
    if (this.state === "ready") {
      this.index.addDoc(doc);
      return;
    }

    if (this.deferred.length === 0) {
      Promise.resolve().then(() => this.finishIndexing());
    }
    this.deferred.push(doc);
  }

  public remove(doc: Favorite): void {
    this.index.removeDoc(doc);
  }

  public deferIndexing(): void {
    this.state = "indexing";
    this.index.maintainSortOrder(false);
  }

  private async finishIndexing(): Promise<void> {
    for (let i = 0; i < this.deferred.length; i += FavoriteIndex.INDEX_BATCH_SIZE) {
      const batch = this.deferred.slice(i, i + FavoriteIndex.INDEX_BATCH_SIZE);

      batch.forEach(doc => this.index.addDoc(doc));
      await yieldControl();
    }
    this.deferred = [];
    this.index.maintainSortOrder(true);
    this.index.sortTerms();
    this.state = "ready";
  }
}

export const FavoritesSearchEngine = new FavoriteIndex();
