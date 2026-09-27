import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { openPostList } from "@/lib/remote/fetchers/action";

export class FavoritesSearchFlow extends FavoritesFlow {

  public searchFavorites(searchQuery: string): void {
    this.flows.display.display(this.model.searchFavorites(searchQuery));
  }

  public openPostList(searchQuery: string): void {
    openPostList(searchQuery);
  }

  public reSearchFavorites(): void {
    this.flows.display.display(this.model.reSearchFavorites(), { fade: false });
  }

  public shuffleSearchResults(): void {
    this.flows.display.display(this.model.shuffleSearchResults());
  }

  public invertSearchResults(): void {
    this.flows.display.display(this.model.invertSearchResults());
  }
}
