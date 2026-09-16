import { FavoritesFlow } from "@/features/favorites/flows/flow";

export class FavoritesSearchFlow extends FavoritesFlow {

  public searchFavorites(searchQuery: string): void {
    this.flows.display.display(this.model.searchFavorites(searchQuery));
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
