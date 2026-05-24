import * as ExtensionResolver from "../../../lib/media/media_extension_resolver";
import * as PostApi from "../../../lib/remote/api/post_fetcher";
import { Favorite } from "../../../types/favorite";
import { FavoriteItem } from "../types/favorite_item";
import { Post } from "../../../types/api";
import { fetchVideoDurationFromFavorite } from "../../../lib/remote/rule34/video_duration_fetcher";
import { isVideo } from "../../../lib/media/media_type_guards";
import { tagsAreValid } from "../../../lib/search/tags/tag_validator";
import { withExponentialBackoff } from "../../../lib/async/timing";

let onMetadataPopulated: (favorite: Favorite) => void = () => undefined;
let beforeUpdateTags: (favorite: Favorite) => void = () => undefined;
let afterUpdateTags: (favorite: Favorite) => void = () => undefined;

export function setup(
  onUpdated: (favorite: Favorite) => void,
  beforeUpdateTagsFn: (favorite: Favorite) => void,
  afterUpdateTagsFn: (favorite: Favorite) => void
): void {
  onMetadataPopulated = onUpdated;
  beforeUpdateTags = beforeUpdateTagsFn;
  afterUpdateTags = afterUpdateTagsFn;
}

export function fetchMissingMetadata(favorites: FavoriteItem[]): void {
  fetchMetadata(favorites.filter(f => f.metadata.isUnpopulated));
  fetchDurations(favorites.filter(f => isVideo(f) && f.metadata.metrics.duration === 0));
}

function isUnpopulated(post: Post): boolean {
  return post.width === 0 || post.tags === "";
}

function fetchMetadata(favorites: FavoriteItem[]): void {
  for (const favorite of favorites) {
    withExponentialBackoff(() => PostApi.fetchPostWithFallback(favorite.id), 5)
      .then(post => processPost(favorite, post))
      .catch(console.error);
  }
}

function fetchDurations(favorites: FavoriteItem[]): void {
  favorites.forEach(favorite => {
    fetchVideoDurationFromFavorite(favorite).then(duration => {
      favorite.metadata.metrics.duration = duration;
      onMetadataPopulated(favorite);
    }).catch(console.error);
  });
}

function processPost(favorite: FavoriteItem, post: Post): void {
  if (isUnpopulated(post)) {
    return;
  }

  if (!tagsAreValid(favorite, post)) {
    beforeUpdateTags(favorite);
    favorite.updateTags(post);
    afterUpdateTags(favorite);
  }
  favorite.populateMetadata(post);
  ExtensionResolver.setExtensionFromPost(post);
  onMetadataPopulated(favorite);
}
