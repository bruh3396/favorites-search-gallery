import { ParsedPost, Post } from "@/types/api";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Enricher } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesDurationEnricher } from "@/features/favorites/model/enrichment/duration_enricher";
import { FavoritesMetadataEnricher } from "@/features/favorites/model/enrichment/metadata_enricher";
import { MediaItem } from "@/types/media";
import { TagCategoryMap } from "@/types/search";
import { TermUpdate } from "@/lib/search/engines/search_engine";
import { isVideo } from "@/lib/media/media_type";
import { postIsStale } from "@/lib/domain/post/status";

interface EnricherDependencies {
  onFavoriteEnriched: (favorite: Favorite) => void;
  onTagsUpdated: (updates: TermUpdate<Favorite>[]) => void;
  resolvePosts: (posts: Post[], onResolved: (resolved: ParsedPost) => void) => Promise<void>;
  persistTagCategories: (tagCategories: TagCategoryMap) => void;
  readDuration: (item: MediaItem) => Promise<number>;
  persistPost: (post: Post) => void;
}

export class FavoritesEnricher implements Enricher {
  private readonly metadataEnricher: FavoritesMetadataEnricher;
  private readonly durationEnricher: FavoritesDurationEnricher;

  constructor(dependencies: EnricherDependencies) {
    const tagUpdater = new CoalescingExecutor(FavoritesConfig.apiCoalesceSize, FavoritesConfig.apiCoalesceTimeout, dependencies.onTagsUpdated);

    this.metadataEnricher = new FavoritesMetadataEnricher(
      dependencies.onFavoriteEnriched,
      update => tagUpdater.schedule(update),
      dependencies.resolvePosts,
      dependencies.persistTagCategories
    );
    this.durationEnricher = new FavoritesDurationEnricher(dependencies.onFavoriteEnriched, dependencies.readDuration, dependencies.persistPost);
  }

  public async enrich(favorites: Favorite[]): Promise<void> {
    await this.metadataEnricher.enrich(favorites.filter(favorite => postIsStale(favorite.post)));
    this.durationEnricher.enrich(favorites.filter(favorite => isVideo(favorite) && favorite.post.duration === 0));
  }
}
