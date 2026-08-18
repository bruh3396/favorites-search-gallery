import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { fetchDeletedPost, fetchPost } from "@/lib/remote/api/post";
import { ApiConfig } from "@/config/api_config";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { Post } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { tagsNeedCorrection } from "@/lib/search/tags/tag_corrector";
import { withExponentialBackoff } from "@/lib/async/scheduling";

let onPopulated: (favorite: Favorite) => void = () => undefined;
let beforeUpdateTags: (favorite: Favorite) => void = () => undefined;
let afterUpdateTags: (favorite: Favorite) => void = () => undefined;
let onCategoriesResolved: (categoryMap: TagCategoryMap) => void = () => undefined;

export function setup(
  onPopulatedFn: (favorite: Favorite) => void,
  beforeUpdateTagsFn: (favorite: Favorite) => void,
  afterUpdateTagsFn: (favorite: Favorite) => void,
  onCategoriesResolvedFn: (categoryMap: TagCategoryMap) => void
): void {
  onPopulated = onPopulatedFn;
  beforeUpdateTags = beforeUpdateTagsFn;
  afterUpdateTags = afterUpdateTagsFn;
  onCategoriesResolved = onCategoriesResolvedFn;
}

export function fetchMetadata(favorites: FavoriteItem[]): void {
  for (const favorite of favorites) {
    withExponentialBackoff(() => resolvePost(favorite), ApiConfig.metadataRetries)
    .then(post => processPost(favorite, post))
    .catch(console.error);
  }
}

function resolvePost(favorite: FavoriteItem): Promise<Post> {
  if (favorite.deleted) {
    return fetchDeletedPost(favorite.id);
  }
  return fetchPost(favorite.id, () => markDeleted(favorite));
}

function markDeleted(favorite: FavoriteItem): void {
  favorite.markDeleted();
  onPopulated(favorite);
}

function processPost(favorite: FavoriteItem, post: Post): void {
  if (isUnpopulated(post)) {
    return;
  }
  onCategoriesResolved(post.tagCategories);

  if (tagsNeedCorrection(favorite, post)) {
    beforeUpdateTags(favorite);
    favorite.updateTags(post);
    afterUpdateTags(favorite);
  }
  favorite.populateMetadata(post);
  ExtensionResolver.setExtensionFromPost(post);
  onPopulated(favorite);
}

const isUnpopulated = (post: Post): boolean => post.width === 0 || post.tags === "";
