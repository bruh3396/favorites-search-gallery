import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesElement } from "@/features/favorites/types/favorites_element";
import { FavoritesEnricher } from "@/features/favorites/model/enrichment/enricher";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { IdentifiedList } from "@/lib/collection/identified_list";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";

export class FavoritesModel {
  private readonly collection: IdentifiedList<Favorite>;
  private readonly searcher: FavoritesSearcher;
  private readonly loader: FavoritesLoader;
  private readonly enricher: FavoritesEnricher;
  private readonly paginator: Paginator<Favorite>;

  constructor(context: AppContext) {
    FavoritesElement.configure(context.flags.imagusSupportEnabled, context.flags.galleryDisabled, context.environment.onMobileDevice, context.environment.userIsOnTheirOwnFavoritesPage);
    this.collection = new IdentifiedList<Favorite>();
    this.searcher = new FavoritesSearcher(context.preferences, context.environment);
    this.loader = new FavoritesLoader(context.environment);
    this.enricher = new FavoritesEnricher({ onFavoriteEnriched: (favorite): void => this.loader.updateStoredFavorite(favorite), onTagsUpdated: (updates): void => this.searcher.update(updates) });
    this.paginator = new Paginator<Favorite>({ resultsPerPage: (): number => context.preferences.favorites.resultsPerPage.value, nearbyPageCount: FavoritesConfig.nearbyPageCount });
    this.searcher.setup(context.events.favorites.searchResultsUpdated.emit);
  }

  public loadStoredFavorites(): Promise<void> {
    return this.loader.readStoredFavorites().then((favorites) => {
      this.collection.setAll(favorites);
      this.enricher.enrich(favorites);
    });
  }

  public streamStoredFavorites(onBatch: (count: number) => void): Promise<void> {
    let loadedCount = 0;
    return this.loader.streamStoredFavorites((favorites) => {
      this.collection.append(favorites);
      loadedCount += favorites.length;
      onBatch(loadedCount);
    }).then(() => {
      this.enricher.enrich(this.collection.getAll());
    });
  }

  public fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
    return this.loader.fetchAllFavorites((favorites) => {
      this.collection.append(favorites);
      this.searcher.add(favorites);
      this.enricher.enrich(favorites);
      onSearchResultsFound(this.searcher.appendResults(favorites));
    }, firstPageFavorites);
  }

  public fetchNewFavorites(firstPageFavorites?: HTMLElement[]): Promise<Favorite[]> {
    return this.loader.fetchNewFavorites(this.collection.getAllIds(), firstPageFavorites)
      .then((newFavorites) => {
        if (newFavorites.length > 0) {
          this.collection.prepend(newFavorites);
          this.searcher.add(newFavorites);
          this.enricher.enrich(newFavorites);
        }
        return newFavorites;
      });
  }

  public indexAllFavorites(): void {
    this.searcher.index(this.collection.getAll());
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
    return this.loader.destroyStore();
  }

  public deleteStoredFavorite(id: string): Promise<void> {
    return this.loader.deleteStoredFavorite(id);
  }

  public storeFavorites(favorites: Favorite[]): Promise<void> {
    return this.loader.storeFavorites(favorites);
  }

  public hasStoredFavorites(): Promise<boolean> {
    return this.loader.hasStoredFavorites();
  }
  public countStoredFavorites(): Promise<number> {
    return this.loader.countStoredFavorites();
  }

  public loadFavoriteIds(): Promise<string[]> {
    return this.loader.loadFavoriteIds();
  }

  public getTagsForIds(ids: string[]): Promise<Map<string, Set<string>>> {
    return this.loader.getTagsForIds(ids);
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
