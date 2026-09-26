import { FavoritesFlow, FavoritesFlowDependencies } from "@/features/favorites/flows/flow";
import { ContentDisplayOptions } from "@/types/ui";
import { Display } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { FavoritesInfiniteDisplay } from "@/features/favorites/flows/display/infinite_display";
import { FavoritesPaginatedDisplay } from "@/features/favorites/flows/display/paginated_display";
import { NavigationKey } from "@/types/input";

export class FavoritesDisplayFlow extends FavoritesFlow {
  private readonly paginatedDisplay: FavoritesPaginatedDisplay;
  private readonly infiniteDisplay: FavoritesInfiniteDisplay;

  constructor(dependencies: FavoritesFlowDependencies) {
    super(dependencies);
    this.paginatedDisplay = new FavoritesPaginatedDisplay(this.model, this.view, this.context.events, this.context.shell);
    this.infiniteDisplay = new FavoritesInfiniteDisplay(this.view, this.context.shell);
  }

  public display(favorites: Favorite[], options?: ContentDisplayOptions): void {
    this.view.setMatchCount(favorites.length);
    this.activeDisplay().initialize(favorites, options);
  }

  public sync(favorites: Favorite[]): void {
    this.view.updateFetchStatus(
      this.model.getAllFavorites().length,
      this.model.getCurrentSearchResults().length
    );
    this.activeDisplay().sync(favorites);
  }

  public toggleInfiniteScroll(): void {
    this.inactiveDisplay().teardown();
    this.redisplayLatestResults();
  }

  public redisplayLatestResults(): void {
    this.display(this.model.getCurrentSearchResults(), { fade: false });
  }

  public clear(): void {
    this.display([]);
  }

  public advance(direction: NavigationKey): boolean {
    return this.activeDisplay().advance(direction);
  }

  public goToPage(pageNumber: number): void {
    this.activeDisplay().goToPage(pageNumber);
  }

  private activeDisplay(): Display {
    return this.context.preferences.favorites.infiniteScroll.value ? this.infiniteDisplay : this.paginatedDisplay;
  }

  private inactiveDisplay(): Display {
    return this.activeDisplay() === this.infiniteDisplay ? this.paginatedDisplay : this.infiniteDisplay;
  }
}
