import * as PostResolver from "@/lib/post/resolver";
import * as TagCategoryStore from "@/lib/tag_categories/store";
import { ParsedPost, Post } from "@/types/api";
import { Favorite } from "@/types/favorite";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesMetadataEnricher {
  constructor(
    private readonly onFavoriteEnriched: (favorite: Favorite) => void,
    private readonly beforeTagsChanged: (favorite: Favorite) => void,
    private readonly afterTagsChanged: (favorite: Favorite) => void
  ) {}

  public enrich(favorites: Favorite[]): Promise<void> {
    const favoritesById = new Map(favorites.map(favorite => [favorite.id, favorite]));
    return PostResolver.resolveAll(
      favorites.map(favorite => favorite.post),
      resolved => this.applyPost(favoritesById.get(resolved.post.id), resolved)
    );
  }

  private applyPost(favorite: Favorite | undefined, { post, tagCategories }: ParsedPost): void {
    if (favorite === undefined) {
      return;
    }
    TagCategoryStore.persistAll(tagCategories);

    if (tagsAreDifferent(favorite, post)) {
      this.beforeTagsChanged(favorite);
      favorite.enrich(post);
      this.afterTagsChanged(favorite);
    } else {
      favorite.enrich(post);
    }
    this.onFavoriteEnriched(favorite);
  }
}

function tagsAreDifferent(favorite: Favorite, post: Post): boolean {
  const difference = favorite.tags.symmetricDifference(toTagSet(post.tags));
  return difference.size > 1 || (difference.size === 1 && !difference.has(favorite.id));
}
