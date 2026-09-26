import { FavoritesFlow } from "@/features/favorites/flows/flow";

export class FavoritesFavoriterFlow extends FavoritesFlow {
  public handleFavoriteRemoved(id: string): void {
    this.model.deleteStoredFavorite(id);
    this.view.setFavorited(id, false);
  }
}
