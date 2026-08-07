import * as FavoritesDurationResolver from "@/features/favorites/model/enrichment/duration_resolver";
import * as FavoritesMetadataResolver from "@/features/favorites/model/enrichment/metadata_resolver";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { TagCategoryMap } from "@/types/search";
import { isVideo } from "@/lib/media/type_predicates";

export function setup(
  onPopulated: (favorite: Favorite) => void,
  beforeUpdateTags: (favorite: Favorite) => void,
  afterUpdateTags: (favorite: Favorite) => void,
  onCategoriesResolved: (categoryMap: TagCategoryMap) => void
): void {
  FavoritesMetadataResolver.setup(onPopulated, beforeUpdateTags, afterUpdateTags, onCategoriesResolved);
  FavoritesDurationResolver.setup(onPopulated);
}

export function enrich(favorites: FavoriteItem[]): void {
  FavoritesMetadataResolver.fetchMetadata(favorites.filter(hasUnpopulatedMetadata));
  FavoritesDurationResolver.fetchDurations(favorites.filter(isVideoMissingDuration));
}

const hasUnpopulatedMetadata = (favorite: FavoriteItem): boolean => favorite.metadata.isUnpopulated;
const isVideoMissingDuration = (favorite: FavoriteItem): boolean => isVideo(favorite) && favorite.metadata.metrics.duration === 0;
