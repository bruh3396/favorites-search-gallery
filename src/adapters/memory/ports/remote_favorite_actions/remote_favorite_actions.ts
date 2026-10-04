import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryClient } from "@/adapters/memory/client/client";

export class MemoryRemoteFavoriteActions implements RemoteFavoriteActions {
  constructor(private readonly memory: Pick<MemoryClient, "addFavorite" | "removeFavorite">) { }

  public add(id: string): Promise<AddFavoriteResult> {
    this.memory.addFavorite(id);
    return Promise.resolve("added");
  }

  public remove(id: string): Promise<RemoveFavoriteResult> {
    this.memory.removeFavorite(id);
    return Promise.resolve("removed");
  }
}
