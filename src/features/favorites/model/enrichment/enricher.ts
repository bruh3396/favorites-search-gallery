import * as FavoritesDurationEnricher from "@/features/favorites/model/enrichment/duration_enricher";
import * as FavoritesMetadataEnricher from "@/features/favorites/model/enrichment/metadata_enricher";
import { Favorite } from "@/types/favorite";
import { TagCategoryMap } from "@/types/search";
import { isVideo } from "@/lib/media/type";
import { postIsStale } from "@/lib/post/status";

export function setup(
  onFavoriteEnriched: (favorite: Favorite) => void,
  beforeTagsChanged: (favorite: Favorite) => void,
  afterTagsChanged: (favorite: Favorite) => void,
  onTagCategoriesResolved: (categoryMap: TagCategoryMap) => void
): void {
  FavoritesMetadataEnricher.setup(onFavoriteEnriched, beforeTagsChanged, afterTagsChanged, onTagCategoriesResolved);
  FavoritesDurationEnricher.setup(onFavoriteEnriched);
}

export async function enrich(favorites: Favorite[]): Promise<void> {
  await FavoritesMetadataEnricher.enrich(favorites.filter(favorite => postIsStale(favorite.post)));
  FavoritesDurationEnricher.enrich(favorites.filter(favorite => isVideo(favorite) && (favorite.post.duration ?? 0) === 0));
}
