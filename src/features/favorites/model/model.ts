import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesCollection } from "@/features/favorites/model/collection/collection";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesEnricher } from "@/features/favorites/model/enrichment/enricher";
import { FavoritesFetcher } from "@/features/favorites/model/retrieval/fetcher";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { FavoritesStore } from "@/features/favorites/model/retrieval/store";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";
import { Post } from "@/types/api";
import { configureFavoritesElement } from "@/lib/ui/thumb/favorites_element";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesModel {
  private readonly collection: FavoritesCollection;
  private readonly searcher: FavoritesSearcher;
  private readonly store: FavoritesStore;
  private readonly fetcher: FavoritesFetcher;
  private readonly enricher: FavoritesEnricher;
  private readonly paginator: Paginator<Favorite>;

  constructor(context: AppContext) {
    configureFavoritesElement(context.flags.imagusSupportEnabled, context.flags.galleryDisabled, context.environment.onMobileDevice, context.environment.userIsOnTheirOwnFavoritesPage);
    const pageId = context.environment.favoritesPageId ?? "";
    const databaseKey = `user${context.environment.onFavoritesPage ? pageId : context.environment.userId}`;

    this.collection = new FavoritesCollection();
    this.searcher = new FavoritesSearcher(context.preferences, context.environment);
    this.store = new FavoritesStore(databaseKey);
    this.fetcher = new FavoritesFetcher(pageId);
    this.enricher = new FavoritesEnricher({ onFavoriteEnriched: (favorite): void => this.store.overwrite(favorite.post), onTagsUpdated: (updates): void => this.searcher.update(updates) });
    this.paginator = new Paginator<Favorite>({ resultsPerPage: (): number => context.preferences.favorites.resultsPerPage.value, nearbyPageCount: FavoritesConfig.nearbyPageCount });
    this.searcher.setup(context.events.favorites.searchResultsUpdated.emit);
  }

  public loadStoredFavorites(): Promise<void> {
    return this.store.readAll().then((posts) => this.enricher.enrich(this.collection.setAll(posts)));
  }

  public streamStoredFavorites(onBatch: (count: number) => void): Promise<void> {
    let loadedCount = 0;
    return this.store.streamAll((posts) => {
      loadedCount += this.collection.append(posts).length;
      onBatch(loadedCount);
    }).then(() => {
      this.enricher.enrich(this.collection.getAll());
    });
  }

  public fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void, firstPageFavorites?: Post[]): Promise<void> {
    return this.fetcher.fetchAll((posts) => {
      const favorites = this.collection.appendDirty(posts);

      this.searcher.add(favorites);
      this.enricher.enrich(favorites);
      onSearchResultsFound(this.searcher.appendResults(favorites));
    }, firstPageFavorites);
  }

  public fetchNewFavorites(firstPageFavorites?: Post[]): Promise<Favorite[]> {
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

  public indexAllFavorites(): void {
    this.searcher.index(this.collection.getAll());
  }

  public compressFavorites(): void {
    this.collection.compress();
  }

  public getAllFavorites(): Favorite[] {
    return this.collection.getAll();
  }
  public getFavorite(id: string): Favorite | undefined {
    return this.collection.get(id);
  }

  public getPixelCount(id: string): number {
    const favorite = this.collection.get(id);
    return favorite === undefined ? 0 : favorite.getMetric("width") * favorite.getMetric("height");
  }

  public searchFavorites(query: string): Favorite[] {
    return this.searcher.search(this.collection.getAll(), query);
  }

  public searchFavoritesPure(favorites: Favorite[], query: string): Favorite[] {
    return this.searcher.searchPure(favorites, query);
  }

  public reSearchFavorites(): Favorite[] {
    return this.searcher.reSearch(this.collection.getAll());
  }

  public searchSpecificFavorites(favorites: Favorite[]): Favorite[] {
    return this.searcher.reSearch(favorites);
  }

  public invertSearchResults(): Favorite[] {
    return this.searcher.invertResults();
  }

  public getCurrentSearchQuery(): string {
    return this.searcher.getCurrentSearchQuery();
  }

  public getCurrentSearchResults(): Favorite[] {
    return this.searcher.getCurrentSearchResults();
  }

  public shuffleSearchResults(): Favorite[] {
    return this.searcher.shuffleSearchResults();
  }

  public destroyStore(): Promise<void> {
    return this.store.destroy();
  }

  public deleteStoredFavorite(id: string): Promise<void> {
    return this.store.delete(id);
  }

  public storeFavorites(favorites: Favorite[]): Promise<void> {
    return this.store.writeAll(favorites.map(favorite => favorite.post));
  }

  public hasStoredFavorites(): Promise<boolean> {
    return this.store.hasAny();
  }
  public countStoredFavorites(): Promise<number> {
    return this.store.count();
  }

  public loadFavoriteIds(): Promise<string[]> {
    return this.store.readIds();
  }

  public getTagsForIds(ids: string[]): Promise<Map<string, Set<string>>> {
    return this.store.readMany(ids).then(posts => new Map(posts.map(post => [post.id, toTagSet(post.tags)])));
  }

  public paginate(favorites: Favorite[]): Favorite[] {
    return this.paginator.paginate(favorites);
  }

  public repaginateCurrentResults(): Favorite[] {
    return this.paginator.paginate(this.searcher.getCurrentSearchResults());
  }

  public selectPage(pageNumber: number): boolean {
    return this.paginator.selectPage(pageNumber);
  }

  public currentPageFavorites(): Favorite[] {
    return this.paginator.currentPageItems();
  }

  public adjacentPageFavorites(): Favorite[] {
    return this.paginator.adjacentPageItems();
  }

  public selectAdjacentPage(direction: NavigationKey): boolean {
    return this.paginator.selectAdjacentPage(direction);
  }

  public selectWrappedAdjacentPage(direction: NavigationKey): boolean {
    return this.paginator.selectWrappedAdjacentPage(direction);
  }

  public atFinalPage(): boolean {
    return this.paginator.atFinalPage();
  }

  public hasOnlyOnePage(): boolean {
    return this.paginator.hasOnlyOnePage();
  }

  public paginationContext(): PaginationState {
    return this.paginator.paginationState();
  }
}
