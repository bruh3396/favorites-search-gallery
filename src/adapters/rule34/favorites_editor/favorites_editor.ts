import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { FavoriteActions } from "@/adapters/rule34/client/favorite_actions/favorite_actions";

const SITE_ADD_STATUS: Record<number, AddFavoriteStatus> = {
  0: "error",
  1: "alreadyAdded",
  2: "loggedOut",
  3: "success"
};

export class Rule34FavoritesEditor implements FavoritesEditor {
  private readonly actions = new FavoriteActions();

  public async add(id: string): Promise<AddFavoriteStatus> {
    const answer = await this.actions.add(id);
    return answer === null ? "error" : SITE_ADD_STATUS[parseInt(answer, 10)] ?? "error";
  }

  public async remove(id: string): Promise<RemoveFavoriteStatus> {
    return await this.actions.remove(id) ? "success" : "error";
  }
}
