import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { Rule34Client } from "@/adapters/rule34/client/client";

const SITE_ADD_STATUS: Record<number, AddFavoriteStatus> = {
  0: "error",
  1: "alreadyAdded",
  2: "loggedOut",
  3: "success"
};

export class Rule34FavoritesEditor implements FavoritesEditor {
  constructor(private readonly site: Pick<Rule34Client, "addFavorite" | "removeFavorite">) { }

  public async add(id: string): Promise<AddFavoriteStatus> {
    const answer = await this.site.addFavorite(id);
    return answer === null ? "error" : SITE_ADD_STATUS[parseInt(answer, 10)] ?? "error";
  }

  public async remove(id: string): Promise<RemoveFavoriteStatus> {
    return await this.site.removeFavorite(id) ? "success" : "error";
  }
}
