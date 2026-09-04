import * as PostResolver from "@/lib/post/resolver";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { toTagSet } from "@/utils/pure/tag";

let onFavoriteEnriched: (favorite: Favorite) => void = () => undefined;
let beforeTagsChanged: (favorite: Favorite) => void = () => undefined;
let afterTagsChanged: (favorite: Favorite) => void = () => undefined;
let onTagCategoriesResolved: (categoryMap: TagCategoryMap) => void = () => undefined;

export function setup(
  onFavoriteEnrichedFn: (favorite: Favorite) => void,
  beforeTagsChangedFn: (favorite: Favorite) => void,
  afterTagsChangedFn: (favorite: Favorite) => void,
  onTagCategoriesResolvedFn: (categoryMap: TagCategoryMap) => void
): void {
  onFavoriteEnriched = onFavoriteEnrichedFn;
  beforeTagsChanged = beforeTagsChangedFn;
  afterTagsChanged = afterTagsChangedFn;
  onTagCategoriesResolved = onTagCategoriesResolvedFn;
}

export function enrich(favorites: Favorite[]): Promise<void> {
  const favoritesById = new Map(favorites.map(favorite => [favorite.id, favorite]));
  return PostResolver.resolvePosts(
    favorites.map(favorite => favorite.post),
    post => applyPost(favoritesById.get(post.id), post)
  );
}

function applyPost(favorite: Favorite | undefined, post: Post): void {
  if (favorite === undefined) {
    return;
  }
  onTagCategoriesResolved(post.tagCategories);

  if (tagsAreDifferent(favorite, post)) {
    beforeTagsChanged(favorite);
    favorite.enrich(post);
    afterTagsChanged(favorite);
  } else {
    favorite.enrich(post);
  }
  onFavoriteEnriched(favorite);
}

function tagsAreDifferent(favorite: Favorite, post: Post): boolean {
  const difference = favorite.tags.symmetricDifference(toTagSet(post.tags));
  return difference.size > 1 || (difference.size === 1 && !difference.has(favorite.id));
}
