import { Metric, Rating } from "@/types/search";
import { Arena } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";

export class FavoritesItem implements Favorite {
  private readonly arena: Arena;
  private readonly index: number;

  constructor(post: Post, arena: Arena, tagsAreClean: boolean) {
    this.arena = arena;
    this.index = arena.allocate();
    this.enrich(post);

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

  public get post(): Post {
    return this.arena.toPost(this.index);
  }

  public get media(): Media {
    return this.arena.media(this.index);
  }

  public get rating(): Rating {
    return this.arena.rating(this.index);
  }

  public get isNew(): boolean {
    return this.arena.isNewFavorite(this.index);
  }

  public get pixelCount(): number {
    return this.getMetric("width") * this.getMetric("height");
  }

  public consumeTags(): Set<string> {
    return this.arena.consumeTagSet(this.index);
  }

  public getMetric(metric: Metric): number {
    return this.arena.getMetric(this.index, metric);
  }

  public setDurationSeconds(durationSeconds: number): void {
    this.arena.setDurationSeconds(this.index, durationSeconds);
  }

  public markAsNew(): void {
    this.arena.markNew(this.index);
  }

  public enrich(post: Post): void {
    this.arena.write(this.index, post);
  }
}
