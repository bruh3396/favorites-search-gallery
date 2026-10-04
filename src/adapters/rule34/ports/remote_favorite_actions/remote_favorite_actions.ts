import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { Rule34FavoriteActions, Rule34FavoriteActionsDependencies } from "@/adapters/rule34/ports/remote_favorite_actions/favorite_actions";

export class Rule34RemoteFavoriteActions implements RemoteFavoriteActions {
  private readonly favoriteActions: Rule34FavoriteActions;

  constructor(dependencies: Rule34FavoriteActionsDependencies) {
    this.favoriteActions = new Rule34FavoriteActions(dependencies);
  }

  public async add(id: string): Promise<AddFavoriteResult> {
    return await this.favoriteActions.add(id) ?? "cancelled";
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    return await this.favoriteActions.remove(id) ? "removed" : "cancelled";
  }
}
