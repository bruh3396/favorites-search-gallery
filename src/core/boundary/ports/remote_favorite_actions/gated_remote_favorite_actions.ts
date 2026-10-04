import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";

export interface GatedRemoteFavoriteActionsDependencies {
  remoteFavoriteActions: RemoteFavoriteActions;
  isOpen: () => boolean;
}

export class GatedRemoteFavoriteActions implements RemoteFavoriteActions {
  constructor(private readonly dependencies: GatedRemoteFavoriteActionsDependencies) { }

  public add(id: string): Promise<AddFavoriteResult> {
    return this.dependencies.isOpen() ? this.dependencies.remoteFavoriteActions.add(id) : Promise.resolve("blocked");
  }

  public remove(id: string): Promise<RemoveFavoriteResult> {
    return this.dependencies.isOpen() ? this.dependencies.remoteFavoriteActions.remove(id) : Promise.resolve("blocked");
  }
}
