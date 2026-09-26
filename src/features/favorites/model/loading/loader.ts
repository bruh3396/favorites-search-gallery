import { Collection, Enricher, Fetcher, Searcher, Store } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";

export class FavoritesLoader {
  private readonly store: Store;
  private readonly fetcher: Fetcher;
  private readonly collection: Collection;
  private readonly searcher: Searcher;
  private readonly enricher: Enricher;

  constructor({ store, fetcher, collection, searcher, enricher }: { store: Store; fetcher: Fetcher; collection: Collection; searcher: Searcher; enricher: Enricher }) {
    this.store = store;
    this.fetcher = fetcher;
    this.collection = collection;
    this.searcher = searcher;
    this.enricher = enricher;
  }

  public loadStored(): Promise<void> {
    return this.store.readAll().then((posts) => {
      this.enricher.enrich(this.collection.setAll(posts));
    });
  }

  public streamStored(onBatch: (count: number) => void): Promise<void> {
    let loadedCount = 0;
    return this.store.streamAll((posts) => {
      loadedCount += this.collection.append(posts).length;
      onBatch(loadedCount);
    }).then(() => {
      this.enricher.enrich(this.collection.getAll());
    });
  }

  public fetchAll(onSearchResultsFound: (newSearchResults: Favorite[]) => void, firstPageFavorites?: Post[]): Promise<void> {
    return this.fetcher.fetchAll((posts) => {
      const favorites = this.collection.appendDirty(posts);

      this.searcher.add(favorites);
      this.enricher.enrich(favorites);
      onSearchResultsFound(this.searcher.appendResults(favorites));
    }, firstPageFavorites);
  }

  public fetchNew(firstPageFavorites?: Post[]): Promise<Favorite[]> {
    return this.fetcher.fetchNew(this.collection.getAllIds(), firstPageFavorites)
      .then((posts) => {
        if (posts.length === 0) {
          return [];
        }
        const newFavorites = this.collection.prependDirty(posts);

        this.searcher.add(newFavorites);
        this.enricher.enrich(newFavorites);
        return newFavorites;
      });
  }
}
