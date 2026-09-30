import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites";
import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesCollection } from "@/features/favorites/model/collection/collection";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { FavoritesPostLibrary } from "@/features/favorites/model/posts/library";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";
import { Post } from "@/core/domain/post/post";

export class FavoritesModel {
  private readonly collection: FavoritesCollection;
  private readonly searcher: FavoritesSearcher;
  private readonly loader: FavoritesLoader;
  private readonly paginator: Paginator<Favorite>;
  private readonly remoteFavorites: RemoteFavorites;
  private readonly localFavorites: LocalFavorites;

  constructor(context: AppContext, onSearchResultsChanged: (results: Favorite[]) => void) {
    const { remoteFavorites, remotePosts, remoteMedia, localFavorites, localPosts, localTagCategories, scheduler } = context.ports;

    this.remoteFavorites = remoteFavorites;
    this.localFavorites = localFavorites;
    this.collection = new FavoritesCollection();
    this.searcher = new FavoritesSearcher(context.preferences, context.environment, onSearchResultsChanged);
    this.loader = new FavoritesLoader({
      remoteFavorites,
      localFavorites,
      localTagCategories,
      postLibrary: new FavoritesPostLibrary({
        localPosts,
        remotePosts,
        remoteMedia,
        scheduler,
        onRefreshed: (refreshed): void => this.loader.applyRefreshed(refreshed)
      }),
      collection: this.collection,
      searcher: this.searcher,
      scheduler
    });
    this.paginator = new Paginator<Favorite>({
      resultsPerPage: (): number => context.preferences.favorites.resultsPerPage.value,
      nearbyPageCount: FavoritesConfig.nearbyPageCount
    });
  }

  public streamStoredFavorites(onBatch: (posts: Post[]) => void): Promise<void> {
    return this.loader.streamStored(onBatch);
  }

  public fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void): Promise<void> {
    return this.loader.fetchAll(onSearchResultsFound);
  }

  public fetchNewFavorites(): Promise<Favorite[]> {
    return this.loader.fetchNew();
  }

  public fetchFavoriteCount(): Promise<number | null> {
    return this.remoteFavorites.fetchCount();
  }

  public addFavorite(id: string): Promise<AddFavoriteResult> {
    return this.remoteFavorites.add(id);
  }

  public removeFavorite(id: string): Promise<RemoveFavoriteResult> {
    return this.remoteFavorites.remove(id);
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
    return this.localFavorites.clear();
  }

  public deleteStoredFavorite(id: string): Promise<void> {
    return this.localFavorites.remove(id);
  }

  public storeFavorites(favorites: Favorite[]): Promise<void> {
    return this.loader.storeMembership(favorites);
  }

  public countStoredFavorites(): Promise<number> {
    return this.localFavorites.getAll().then(ids => ids.length);
  }

  public loadFavoriteIds(): Promise<string[]> {
    return this.localFavorites.getAll();
  }

  public getTagsForIds(ids: string[]): Promise<Map<string, Set<string>>> {
    return Promise.resolve(this.collection.getTags(ids));
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
