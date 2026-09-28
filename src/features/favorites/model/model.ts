import { Post } from "@/core/domain/post/post";
import * as PostStore from "@/lib/domain/post/store";
import * as TagCategoryStore from "@/lib/domain/tag/category_store";
import { AppContext } from "@/app/context/context";
import { Database } from "@/lib/storage/database";
import { Favorite } from "@/types/favorite";
import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports/favorites_editor";
import { FavoritesSource } from "@/core/boundary/ports/favorites_source";
import { FavoritesCollection } from "@/features/favorites/model/collection/collection";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesEnricher } from "@/features/favorites/model/enrichment/enricher";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { FavoritesStore } from "@/features/favorites/model/retrieval/store";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";
import { PostResolver } from "@/lib/domain/post/resolver";
import { readVideoDuration } from "@/lib/media/duration";

export class FavoritesModel {
  private readonly collection: FavoritesCollection;
  private readonly searcher: FavoritesSearcher;
  private readonly store: FavoritesStore;
  private readonly loader: FavoritesLoader;
  private readonly paginator: Paginator<Favorite>;
  private readonly source: FavoritesSource;
  private readonly editor: FavoritesEditor;

  constructor(context: AppContext, onSearchResultsChanged: (results: Favorite[]) => void) {
    const { favoritesSource, favoritesEditor, postSource } = context.ports;
    const postResolver = new PostResolver(postSource);

    this.source = favoritesSource;
    this.editor = favoritesEditor;
    this.collection = new FavoritesCollection();
    this.searcher = new FavoritesSearcher(context.preferences, context.environment, onSearchResultsChanged);
    this.store = new FavoritesStore(new Database<Post>("FavoritesV2", `user${context.environment.favoritesId}`));
    this.loader = new FavoritesLoader({
      store: this.store,
      source: this.source,
      collection: this.collection,
      searcher: this.searcher,
      enricher: new FavoritesEnricher({
        onFavoriteEnriched: (favorite): void => this.store.overwrite(favorite.post),
        onTagsUpdated: (updates): void => this.searcher.update(updates),
        resolvePosts: (posts, onResolved): Promise<void> => postResolver.resolveAll(posts, onResolved),
        persistTagCategories: TagCategoryStore.persistAll,
        readDuration: readVideoDuration,
        persistPost: PostStore.write
      })
    });
    this.paginator = new Paginator<Favorite>({
      resultsPerPage: (): number => context.preferences.favorites.resultsPerPage.value,
      nearbyPageCount: FavoritesConfig.nearbyPageCount
    });
  }

  public loadStoredFavorites(): Promise<void> {
    return this.loader.loadStored();
  }

  public streamStoredFavorites(onBatch: (count: number) => void): Promise<void> {
    return this.loader.streamStored(onBatch);
  }

  public fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void): Promise<void> {
    return this.loader.fetchAll(onSearchResultsFound);
  }

  public fetchNewFavorites(): Promise<Favorite[]> {
    return this.loader.fetchNew();
  }

  public fetchFavoritesCount(): Promise<number | null> {
    return this.source.count();
  }

  public addFavorite(id: string): Promise<AddFavoriteStatus> {
    return this.editor.add(id);
  }

  public removeFavorite(id: string): Promise<RemoveFavoriteStatus> {
    return this.editor.remove(id);
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
    return this.store.readTags(ids);
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
