import { Metric, Post } from "@/core/domain/post/post";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesArena } from "@/core/features/favorites/collection/arena";
import { Media } from "@/core/domain/media/media";

export class ArenaFavorite implements Favorite {
  public readonly slot: number;
  private readonly arena: FavoritesArena;

  constructor(post: Post, arena: FavoritesArena) {
    this.arena = arena;
    this.slot = arena.allocate();
    arena.write(this.slot, post);
    arena.cacheTags(this.slot, this.tags);
  }

  public get numericId(): number {
    return this.arena.getNumericId(this.slot);
  }

  public get id(): string {
    return String(this.numericId);
  }

  public get tags(): ReadonlySet<string> {
    return this.arena.getTags(this.slot);
  }

  public get media(): Media {
    return this.arena.getMedia(this.slot);
  }

  public get isNew(): boolean {
    return this.arena.isNew(this.slot);
  }

  public get ratingBit(): number {
    return this.arena.getRatingBit(this.slot);
  }

  public getMetric(metric: Metric): number {
    return this.arena.getMetric(this.slot, metric);
  }
}
