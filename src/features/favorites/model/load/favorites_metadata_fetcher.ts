import * as ExtensionCache from "../../../../lib/media/extension_cache";
import * as PostAPI from "../../../../lib/server/fetch/post_fetcher";
import { Favorite } from "../../../../types/favorite";
import { FavoriteItem } from "../../type/favorite_item";
import { Post } from "../../../../types/post";
import { fetchVideoDurationFromFavorite } from "../../../../lib/server/fetch/video_duration_fetcher";
import { isVideo } from "../../../../lib/media/media_resolver";

let onMetadataUpdated: (favorite: Favorite) => void = () => undefined;
let isDatabaseWritten = false;

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
  if (favorites.length === 0) {
    return;
  }
  const favoriteMap = new Map(favorites.map(f => [f.id, f]));

  PostAPI.fetchMultiplePostsFromAPI([...favoriteMap.keys()])
    .then(postMap => processPostMap(postMap, favoriteMap))
    .catch(console.error);
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

function processPostMap(postMap: Record<string, Post>, favoriteMap: Map<string, FavoriteItem>): void {
  for (const [id, post] of Object.entries(postMap)) {
    const favorite = favoriteMap.get(id);

    if (favorite === undefined) {
      continue;
    }
    favorite.validateTags(post);
    favorite.populateMetadata(post);
    ExtensionCache.setExtensionFromPost(post);

    if (isDatabaseWritten) {
      onMetadataUpdated(favorite);
    }
  }
}
