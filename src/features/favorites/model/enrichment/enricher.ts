import { Favorite } from "@/types/favorite";
import { FavoritesDurationEnricher } from "@/features/favorites/model/enrichment/duration_enricher";
import { FavoritesMetadataEnricher } from "@/features/favorites/model/enrichment/metadata_enricher";
import { TermUpdate } from "@/lib/search/search_engine";
import { isVideo } from "@/lib/media/type";
import { postIsStale } from "@/lib/domain/post/status";

export class FavoritesEnricher {
  private readonly metadataEnricher: FavoritesMetadataEnricher;
  private readonly durationEnricher: FavoritesDurationEnricher;

  constructor(
    onFavoriteEnriched: (favorite: Favorite) => void,
    onTagsUpdated: (updates: TermUpdate<Favorite>[]) => void
  ) {
    this.metadataEnricher = new FavoritesMetadataEnricher(onFavoriteEnriched, onTagsUpdated);
    this.durationEnricher = new FavoritesDurationEnricher(onFavoriteEnriched);
  }

  public async enrich(favorites: Favorite[]): Promise<void> {
    await this.metadataEnricher.enrich(favorites.filter(favorite => postIsStale(favorite.post)));
    this.durationEnricher.enrich(favorites.filter(favorite => isVideo(favorite) && (favorite.post.duration ?? 0) === 0));
  }
}
