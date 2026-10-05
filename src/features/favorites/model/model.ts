import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { FavoritesModelCallbacks, LoadProgress, PulledFavorites } from "@/features/favorites/types/types";
import { AppContext } from "@/app/context/context";
import { Dimensions2D } from "@/types/geometry";
import { Favorite } from "@/types/favorite";
import { FavoritesCollection } from "@/features/favorites/model/collection/collection";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { FavoritesPostLibrary } from "@/features/favorites/model/posts/library";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { FavoritesThumbSizeRecorder } from "@/features/favorites/model/thumb_size_recorder";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";
import { RatingMask } from "@/types/search";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

const NEARBY_PAGE_COUNT = 5;

export class FavoritesModel {
  private readonly collection: FavoritesCollection;
  private readonly searcher: FavoritesSearcher;
  private readonly loader: FavoritesLoader;
  private readonly paginator: Paginator<Favorite>;
  private readonly remoteFavorites: RemoteFavorites;
  private readonly remoteFavoriteActions: RemoteFavoriteActions;
  private readonly localFavorites: LocalFavorites;
  private readonly thumbSizeRecorder: FavoritesThumbSizeRecorder;

  constructor(context: AppContext, { onSearchResultsChanged, onPlaceholderFilled }: FavoritesModelCallbacks) {
    const { remoteFavorites, remotePosts, remoteMedia, localFavorites, localPosts, localTagCategories, scheduler } = context.ports;

    this.remoteFavorites = remoteFavorites;
    this.remoteFavoriteActions = context.ports.remoteFavoriteActions;
    this.localFavorites = localFavorites;
    this.collection = new FavoritesCollection();
    this.searcher = new FavoritesSearcher({
      userIsOnTheirOwnFavoritesPage: context.environment.ownsFavorites,
      blacklistedTags: context.environment.blacklistedTags
    }, {
      termsFor: (favorite): Set<string> => this.collection.consumeTags(favorite.id),
      ratingFor: (favorite): RatingMask => this.collection.getRating(favorite.id),
      preferences: context.preferences,
      randomSource: context.ports.randomSource,
      onSearchResultsChanged
    });
    this.loader = new FavoritesLoader({
      remoteFavorites,
      localFavorites,
      localTagCategories,
      postLibrary: new FavoritesPostLibrary({
        localPosts,
        remotePosts,
        remoteMedia,
        scheduler,
        onRefreshed: (refreshed): void => this.loader.applyRefreshedPost(refreshed)
      }),
      collection: this.collection,
      searcher: this.searcher,
      scheduler,
      onPlaceholderFilled
    });
    this.thumbSizeRecorder = new FavoritesThumbSizeRecorder({ ownerId: context.environment.favoritesOwnerId }, context.ports.localKeyedValues);
    this.paginator = new Paginator<Favorite>(
      { nearbyPageCount: NEARBY_PAGE_COUNT },
      (): number => context.preferences.favorites.resultsPerPage.value
    );
  }

  public streamLocalFavorites(onProgress: (progress: LoadProgress) => void): Promise<void> {
    return this.loader.streamLocalFavorites(onProgress);
  }

  public fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void): Promise<void> {
    return this.loader.fetchAllFavorites(onSearchResultsFound);
  }

  public pullNewFavorites(): Promise<PulledFavorites> {
    return this.loader.pullNewFavorites();
  }

  public pruneRemovedFavorites(prependedCount: number): Promise<number> {
    return this.loader.pruneRemovedFavorites(prependedCount);
  }

  public fetchFavoriteCount(): Promise<number | null> {
    return this.remoteFavorites.fetchCount();
  }

  public addFavorite(id: string): Promise<AddFavoriteResult> {
    return this.remoteFavoriteActions.add(id);
  }

  public removeFavorite(id: string): Promise<RemoveFavoriteResult> {
    return this.remoteFavoriteActions.remove(id);
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

  public recordFirstThumbSizes(): void {
    this.thumbSizeRecorder.record(this.searcher.getCurrentSearchResults());
  }

  public getRecordedThumbSizes(): Dimensions2D[] {
    return this.thumbSizeRecorder.getRecorded();
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

  public deleteLocalFavorites(ids: string[]): Promise<void> {
    return this.localFavorites.remove(ids);
  }

  public persistAllFavorites(): Promise<void> {
    return this.loader.persistFavoritesMembership();
  }

  public hasLocalFavorites(): Promise<boolean> {
    return this.localFavorites.getAll().then(ids => ids.length > 0);
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
