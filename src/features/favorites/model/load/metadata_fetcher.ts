import * as ExtensionResolver from "../../../../lib/media/media_extension_resolver";
import * as PostAPI from "../../../../lib/remote/api/post_fetcher";
import { Favorite } from "../../../../types/favorite";
import { FavoriteItem } from "../../types/favorite_item";
import { Post } from "../../../../types/api";
import { fetchVideoDurationFromFavorite } from "../../../../lib/remote/rule34/video_duration_fetcher";
import { isVideo } from "../../../../lib/media/media_type_guards";
import { withExponentialBackoff } from "../../../../lib/core/scheduling/promise";

let onMetadataUpdated: (favorite: Favorite) => void = () => undefined;
let isDatabaseWritten = false;

function isEmpty(post: Post): boolean {
  return post.width === 0 || post.tags === "";
}

export function initialize(callback: (favorite: Favorite) => void): void {
  onMetadataUpdated = callback;
}

export function onDatabaseWritten(): void {
  isDatabaseWritten = true;
}

export function fetchMissingMetadata(favorites: FavoriteItem[]): void {
  fetchMetadata(favorites.filter(f => f.metadata.isUnpopulated));
  fetchDurations(favorites.filter(f => isVideo(f) && f.metadata.metrics.duration === 0));
}

function fetchMetadata(favorites: FavoriteItem[]): void {
  for (const favorite of favorites) {
    withExponentialBackoff(() => PostAPI.fetchPostWithFallback(favorite.id), 5)
      .then(post => processPost(favorite, post))
      .catch(console.error);
  }
}

function fetchDurations(favorites: FavoriteItem[]): void {
  favorites.forEach(favorite => {
    fetchVideoDurationFromFavorite(favorite).then(duration => {
      favorite.metadata.metrics.duration = duration;

      if (isDatabaseWritten) {
        onMetadataUpdated(favorite);
      }
    }).catch(console.error);
  });
}

function processPost(favorite: FavoriteItem, post: Post): void {
  if (isEmpty(post)) {
    return;
  }
  favorite.validateTags(post);
  favorite.populateMetadata(post);
  ExtensionResolver.setExtensionFromPost(post);

  if (isDatabaseWritten) {
    onMetadataUpdated(favorite);
  }
}
