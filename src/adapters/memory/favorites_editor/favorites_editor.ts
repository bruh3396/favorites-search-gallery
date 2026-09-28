import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { MemoryClient } from "@/adapters/memory/client/client";

export class MemoryFavoritesEditor implements FavoritesEditor {
  constructor(private readonly memory: Pick<MemoryClient, "removeFavorite">) { }

  public add(): Promise<AddFavoriteStatus> {
    return Promise.resolve("success");
  }

  public remove(id: string): Promise<RemoveFavoriteStatus> {
    this.memory.removeFavorite(id);
    return Promise.resolve("success");
  }
}
