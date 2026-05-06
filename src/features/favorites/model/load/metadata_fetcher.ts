import * as ExtensionResolver from "../../../../lib/media/media_extension_resolver";
import * as PostAPI from "../../../../lib/remote/api/post_fetcher";
import { Favorite } from "../../../../types/favorite";
import { FavoriteItem } from "../../types/favorite_item";
import { Post } from "../../../../types/api";
import { convertToTagString } from "../../../../utils/string/tags";
import { correctTags } from "../../../../lib/media/media_tag_validator";
import { fetchVideoDurationFromFavorite } from "../../../../lib/remote/rule34/video_duration_fetcher";
import { isVideo } from "../../../../lib/media/media_type_guards";
import { withExponentialBackoff } from "../../../../lib/core/scheduling/promise";

let onMetadataUpdated: (favorite: Favorite) => void = () => undefined;
let onTagsDeIndex: (favorite: Favorite) => void = () => undefined;
let onTagsReIndex: (favorite: Favorite) => void = () => undefined;
let isDatabaseWritten = false;

function isEmpty(post: Post): boolean {
  return post.width === 0 || post.tags === "";
}

function tagsAreEqual(favorite: FavoriteItem, post: Post): boolean {
  const validTags = correctTags(post);
  const difference = favorite.tags.symmetricDifference(validTags);
  const equal = difference.size === 0 || (difference.size === 1 && difference.has(post.id));

  if (equal) {
    return true;
  }
  post.tags = convertToTagString(validTags);
  return false;
}

export function initialize(onUpdated: (favorite: Favorite) => void, onDeIndex: (favorite: Favorite) => void, onReIndex: (favorite: Favorite) => void): void {
  onMetadataUpdated = onUpdated;
  onTagsDeIndex = onDeIndex;
  onTagsReIndex = onReIndex;
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

  if (!tagsAreEqual(favorite, post)) {
    onTagsDeIndex(favorite);
    favorite.updateTags(post);
    onTagsReIndex(favorite);
  }
  favorite.populateMetadata(post);
  ExtensionResolver.setExtensionFromPost(post);

  if (isDatabaseWritten) {
    onMetadataUpdated(favorite);
  }
}
