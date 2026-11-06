import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/favorites_columnar_arena";
import { Media } from "@/core/domain/media/media";
import { Metric } from "@/core/domain/search/metric";
import { Post } from "@/core/domain/post/post";

export class ArenaFavorite implements Favorite {
  public readonly slot: number;
  private readonly favoritesColumnarArena: FavoritesColumnarArena;

  constructor(post: Post, favoritesColumnarArena: FavoritesColumnarArena) {
    this.favoritesColumnarArena = favoritesColumnarArena;
    this.slot = favoritesColumnarArena.allocate();
    favoritesColumnarArena.write(this.slot, post);
  }

  public get numericId(): number {
    return this.favoritesColumnarArena.getNumericId(this.slot);
  }

  public get id(): string {
    return String(this.numericId);
  }

  public get tags(): ReadonlySet<string> {
    return this.favoritesColumnarArena.getTags(this.slot);
  }

  public get media(): Media {
    return this.favoritesColumnarArena.getMedia(this.slot);
  }

  public get isNew(): boolean {
    return this.favoritesColumnarArena.isNew(this.slot);
  }

  public get ratingBit(): number {
    return this.favoritesColumnarArena.getRatingBit(this.slot);
  }

  public get statusBit(): number {
    return this.favoritesColumnarArena.getStatusBit(this.slot);
  }

  public getMetric(metric: Metric): number {
    return this.favoritesColumnarArena.getMetric(this.slot, metric);
  }
}
