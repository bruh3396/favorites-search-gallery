import { AddFavoriteResult, FavoritesEditor, RemoveFavoriteResult } from "@/core/boundary/ports/favorites_editor";
import { MemoryClient } from "@/adapters/memory/client/client";

export class MemoryFavoritesEditor implements FavoritesEditor {
  constructor(private readonly memory: Pick<MemoryClient, "removeFavorite">) { }

  public add(): Promise<AddFavoriteResult> {
    return Promise.resolve("added");
  }

  public remove(id: string): Promise<RemoveFavoriteResult> {
    this.memory.removeFavorite(id);
    return Promise.resolve("removed");
  }
}
