import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { Post } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { fetchPost } from "@/lib/remote/api/post";
import { tagsNeedCorrection } from "@/lib/search/tags/tag_corrector";
import { withExponentialBackoff } from "@/lib/async/async";

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
    withExponentialBackoff(() => fetchPost(favorite.id), 5)
      .then(post => processPost(favorite, post))
      .catch(console.error);
  }
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
