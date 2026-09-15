import { Favorite } from "@/types/favorite";
import { FavoritesDurationEnricher } from "@/features/favorites/model/enrichment/duration_enricher";
import { FavoritesMetadataEnricher } from "@/features/favorites/model/enrichment/metadata_enricher";
import { TermUpdate } from "@/lib/search/engines/search_engine";
import { isVideo } from "@/lib/media/media_type";
import { postIsStale } from "@/lib/domain/post/status";

interface EnricherCallbacks {
  onFavoriteEnriched: (favorite: Favorite) => void;
  onTagsUpdated: (updates: TermUpdate<Favorite>[]) => void;
}

export class FavoritesEnricher {
  private readonly metadataEnricher: FavoritesMetadataEnricher;
  private readonly durationEnricher: FavoritesDurationEnricher;

  constructor(callbacks: EnricherCallbacks) {
    this.metadataEnricher = new FavoritesMetadataEnricher(callbacks.onFavoriteEnriched, callbacks.onTagsUpdated);
    this.durationEnricher = new FavoritesDurationEnricher(callbacks.onFavoriteEnriched);
  }

  public async enrich(favorites: Favorite[]): Promise<void> {
    await this.metadataEnricher.enrich(favorites.filter(favorite => postIsStale(favorite.post)));
    this.durationEnricher.enrich(favorites.filter(favorite => isVideo(favorite) && favorite.post.duration === 0));
  }
}
