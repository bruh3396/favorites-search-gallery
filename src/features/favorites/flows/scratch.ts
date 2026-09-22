import { Favorite } from "@/types/favorite";
import { FavoritesFlow } from "@/features/favorites/flows/flow";

export class FavoritesScratchFlow extends FavoritesFlow {
  public excludeMostFrequentTags(): void {
    let query = "-female";
    let results = this.model.searchFavoritesPure(this.model.getAllFavorites(), query);

    do {
      const top = mostFrequentTag(results);

      if (top === undefined || top.count <= 1) {
        break;
      }
      query += `${query === "" ? "" : " "}-${top.tag}`;
      results = this.model.searchFavoritesPure(results, `-${top.tag}`);
    } while (results.length > 0);

    this.control.runSearch(query);
  }
}

function mostFrequentTag(favorites: Favorite[]): { tag: string; count: number } | undefined {
  const tagCounts = new Map<string, number>();
  let maxCount = 0;
  let maxTag: string | undefined;

  for (const favorite of favorites) {
    for (const tag of favorite.tags) {
      const count = (tagCounts.get(tag) ?? 0) + 1;

      tagCounts.set(tag, count);

      if (count > maxCount) {
        maxCount = count;
        maxTag = tag;
      }
    }
  }
  return maxTag === undefined ? undefined : { tag: maxTag, count: maxCount };
}
