import * as ExtensionResolver from "../../../../lib/media/media_extension_resolver";
import * as PostApi from "../../../../lib/remote/api/post_fetcher";
import { Favorite } from "../../../../types/favorite";
import { FavoriteItem } from "../../types/favorite_item";
import { Post } from "../../../../types/api";
import { fetchVideoDurationFromFavorite } from "../../../../lib/remote/rule34/video_duration_fetcher";
import { isVideo } from "../../../../lib/media/media_type_guards";
import { tagsAreValid } from "../../../../lib/tags/tag_validator";
import { withExponentialBackoff } from "../../../../lib/core/scheduling/promise";

let onMetadataUpdated: (favorite: Favorite) => void = () => undefined;
let onDeIndex: (favorite: Favorite) => void = () => undefined;
let onReIndex: (favorite: Favorite) => void = () => undefined;
let isDatabaseWritten = false;

export function initialize(
  onUpdated: (favorite: Favorite) => void,
  deIndex: (favorite: Favorite) => void,
  reIndex: (favorite: Favorite) => void
): void {
  onMetadataUpdated = onUpdated;
  onDeIndex = deIndex;
  onReIndex = reIndex;
}

export function onDatabaseWritten(): void {
  isDatabaseWritten = true;
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

      if (isDatabaseWritten) {
        onMetadataUpdated(favorite);
      }
    }).catch(console.error);
  });
}

function processPost(favorite: FavoriteItem, post: Post): void {
  if (isUnpopulated(post)) {
    return;
  }

  if (!tagsAreValid(favorite, post)) {
    onDeIndex(favorite);
    favorite.updateTags(post);
    onReIndex(favorite);
  }
  favorite.populateMetadata(post);
  ExtensionResolver.setExtensionFromPost(post);

  if (isDatabaseWritten) {
    onMetadataUpdated(favorite);
  }
}
