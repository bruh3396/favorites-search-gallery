import * as FavoritesDurationEnricher from "@/features/favorites/model/enrichment/duration_enricher";
import * as FavoritesMetadataEnricher from "@/features/favorites/model/enrichment/metadata_enricher";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { TagCategoryMap } from "@/types/search";
import { isVideo } from "@/lib/media/type";

export function setup(
  onFavoriteEnriched: (favorite: Favorite) => void,
  beforeTagsChanged: (favorite: Favorite) => void,
  afterTagsChanged: (favorite: Favorite) => void,
  onCategoriesResolved: (categoryMap: TagCategoryMap) => void
): void {
  FavoritesMetadataEnricher.setup(onFavoriteEnriched, beforeTagsChanged, afterTagsChanged, onCategoriesResolved);
  FavoritesDurationEnricher.setup(onFavoriteEnriched);
}

export function enrich(favorites: FavoriteItem[]): void {
  FavoritesMetadataEnricher.enrich(favorites.filter(favorite => favorite.metadata.isEmpty));
  FavoritesDurationEnricher.enrich(favorites.filter(favorite => isVideo(favorite) && favorite.metadata.metrics.duration === 0));
}
