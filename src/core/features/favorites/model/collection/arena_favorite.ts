import { Metric, Post } from "@/core/domain/post/post";
import { Arena } from "@/core/features/favorites/types/arena";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { Media } from "@/core/domain/media/media";

export class FavoritesArenaFavorite implements Favorite {
  public readonly slot: number;
  private readonly arena: Arena;

  constructor(post: Post, arena: Arena) {
    this.arena = arena;
    this.slot = arena.allocate();
    arena.write(this.slot, post);
    arena.cacheTags(this.slot, this.tags);
  }

  public get id(): string {
    return String(this.arena.getNumericId(this.slot));
  }

  public get tags(): Set<string> {
    return this.arena.getTags(this.slot);
  }

  public get media(): Media {
    return this.arena.getMedia(this.slot);
  }

  public get isNew(): boolean {
    return this.arena.isNew(this.slot);
  }

  public getMetric(metric: Metric): number {
    return this.arena.getMetric(this.slot, metric);
  }
}
