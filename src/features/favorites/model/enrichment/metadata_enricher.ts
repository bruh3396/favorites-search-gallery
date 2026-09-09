import * as PostResolver from "@/lib/domain/post/resolver";
import * as TagCategoryStore from "@/lib/domain/tag_categories/store";
import { ParsedPost, Post } from "@/types/api";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { TermUpdate } from "@/lib/search/search_engine";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesMetadataEnricher {
  private changeUpdater: CoalescingExecutor<TermUpdate<Favorite>>;
  constructor(
    private readonly onFavoriteEnriched: (favorite: Favorite) => void,
    onTagsChanged: (updates: TermUpdate<Favorite>[]) => void
  ) {
    this.changeUpdater = new CoalescingExecutor(FavoritesConfig.tagUpdateCoalesceSize, FavoritesConfig.tagUpdateCoalesceTimeout, onTagsChanged);
  }

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
      const oldTags = new Set(favorite.tags);

      favorite.enrich(post);
      this.changeUpdater.schedule({ doc: favorite, oldTerms: oldTags, newTerms: favorite.tags });
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
