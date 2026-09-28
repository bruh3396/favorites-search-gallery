import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { MemoryFavorites } from "@/adapters/memory/client/favorites";

export class MemoryFavoritesEditor implements FavoritesEditor {
  constructor(private readonly favorites: MemoryFavorites) { }

  // Memory holds no favorites beyond what it was given, so adding only succeeds.
  public add(): Promise<AddFavoriteStatus> {
    return Promise.resolve("success");
  }

  public remove(id: string): Promise<RemoveFavoriteStatus> {
    this.favorites.remove(id);
    return Promise.resolve("success");
  }
}
