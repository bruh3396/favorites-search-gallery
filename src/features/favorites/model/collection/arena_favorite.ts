import { Arena } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { Metric, Post } from "@/core/domain/post/post";

export class ArenaFavorite implements Favorite {
  public readonly index: number;
  private readonly arena: Arena;

  constructor(post: Post, arena: Arena, tagsAreClean: boolean) {
    this.arena = arena;
    this.index = arena.allocate();
    arena.write(this.index, post);

    if (tagsAreClean) {
      arena.cacheTagSet(this.index, this.tags);
    }
  }

  public get id(): string {
    return String(this.arena.id(this.index));
  }

  public get tags(): Set<string> {
    return this.arena.tagSet(this.index);
  }

  public get media(): Media {
    return this.arena.media(this.index);
  }

  public get isNew(): boolean {
    return this.arena.isNewFavorite(this.index);
  }

  public getMetric(metric: Metric): number {
    return this.arena.getMetric(this.index, metric);
  }
}
