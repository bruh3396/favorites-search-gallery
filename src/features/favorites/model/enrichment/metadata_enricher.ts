import { ParsedPost, Post } from "@/types/api";
import { Favorite } from "@/types/favorite";
import { TagCategoryMap } from "@/types/search";
import { TermUpdate } from "@/lib/search/engines/search_engine";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesMetadataEnricher {
  constructor(
    private readonly onFavoriteEnriched: (favorite: Favorite) => void,
    private readonly onTagsChanged: (update: TermUpdate<Favorite>) => void,
    private readonly resolvePosts: (posts: Post[], onResolved: (resolved: ParsedPost) => void) => Promise<void>,
    private readonly persistTagCategories: (tagCategories: TagCategoryMap) => void
  ) { }

  public enrich(favorites: Favorite[]): Promise<void> {
    const favoritesById = new Map(favorites.map(favorite => [favorite.id, favorite]));
    return this.resolvePosts(
      favorites.map(favorite => favorite.post),
      resolved => this.applyPost(favoritesById.get(resolved.post.id), resolved)
    );
  }

  private applyPost(favorite: Favorite | undefined, { post, tagCategories }: ParsedPost): void {
    this.persistTagCategories(tagCategories);

    if (favorite === undefined) {
      return;
    }

    if (tagsAreDifferent(favorite, post)) {
      const oldTags = new Set(favorite.tags);

      favorite.enrich(post);
      this.onTagsChanged({ doc: favorite, oldTerms: oldTags, newTerms: favorite.tags });
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
