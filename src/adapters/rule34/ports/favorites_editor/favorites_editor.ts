import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports/favorites_editor";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

const SITE_ADD_STATUS: Record<number, AddFavoriteStatus> = {
  0: "error",
  1: "alreadyAdded",
  2: "loggedOut",
  3: "success"
};

export class Rule34FavoritesEditor implements FavoritesEditor {
  constructor(private readonly rule34: Pick<Rule34SiteClient, "addFavorite" | "removeFavorite">) { }

  public async add(id: string): Promise<AddFavoriteStatus> {
    const answer = await this.rule34.addFavorite(id);
    return answer === null ? "error" : SITE_ADD_STATUS[parseInt(answer, 10)] ?? "error";
  }

  public async remove(id: string): Promise<RemoveFavoriteStatus> {
    return await this.rule34.removeFavorite(id) ? "success" : "error";
  }
}
