import * as FavoritesTagCorrector from "@/features/favorites/model/enrichment/tag_corrector";
import * as MediaResolver from "@/lib/media/resolver";
import { fetchDeletedPost, fetchPost } from "@/lib/remote/api/post";
import { ApiConfig } from "@/config/api_config";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { Post } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { withExponentialBackoff } from "@/lib/async/scheduling";

let onFavoriteEnriched: (favorite: Favorite) => void = () => undefined;
let beforeTagsChanged: (favorite: Favorite) => void = () => undefined;
let afterTagsChanged: (favorite: Favorite) => void = () => undefined;
let onCategoriesResolved: (categoryMap: TagCategoryMap) => void = () => undefined;

export function setup(
  onFavoriteEnrichedFn: (favorite: Favorite) => void,
  beforeTagsChangedFn: (favorite: Favorite) => void,
  afterTagsChangedFn: (favorite: Favorite) => void,
  onCategoriesResolvedFn: (categoryMap: TagCategoryMap) => void
): void {
  onFavoriteEnriched = onFavoriteEnrichedFn;
  beforeTagsChanged = beforeTagsChangedFn;
  afterTagsChanged = afterTagsChangedFn;
  onCategoriesResolved = onCategoriesResolvedFn;
}

export function enrich(favorites: FavoriteItem[]): void {
  for (const favorite of favorites) {
    withExponentialBackoff(() => fetchPostForFavorite(favorite), ApiConfig.metadataRetries)
      .then(post => applyPost(favorite, post))
      .catch(console.error);
  }
}

function fetchPostForFavorite(favorite: FavoriteItem): Promise<Post> {
  return favorite.deleted ? fetchDeletedPost(favorite.id) : fetchPost(favorite.id, () => markDeleted(favorite));
}

function markDeleted(favorite: FavoriteItem): void {
  favorite.markDeleted();
  onFavoriteEnriched(favorite);
}

function applyPost(favorite: FavoriteItem, post: Post): void {
  if (postIsEmpty(post)) {
    return;
  }
  onCategoriesResolved(post.tagCategories);

  if (FavoritesTagCorrector.correctTagsIfInvalid(favorite, post)) {
    beforeTagsChanged(favorite);
    favorite.updateTags(post);
    afterTagsChanged(favorite);
  }
  favorite.populateMetadata(post);
  MediaResolver.writeExtensionFromPost(post);
  onFavoriteEnriched(favorite);
}

const postIsEmpty = (post: Post): boolean => post.width === 0 || post.tags === "";
