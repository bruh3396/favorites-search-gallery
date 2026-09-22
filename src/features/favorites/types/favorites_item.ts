import { MediaExtension, MediaType } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { compressPreviewSource, decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { Favorite } from "@/types/favorite";
import { FavoritesArena } from "@/features/favorites/types/favorites_arena";
import { FavoritesElement } from "@/features/favorites/types/favorites_element";
import { Post } from "@/types/api";
import { resolveMediaType } from "@/lib/media/media_type";
import { thumbToPost } from "@/features/favorites/types/thumb_to_post";

export class FavoritesItem implements Favorite {
  private readonly arena: FavoritesArena;
  private readonly index: number;
  private previewUrl: string = "";
  private element: FavoritesElement | null = null;

  constructor(source: HTMLElement | Post, arena: FavoritesArena) {
    this.arena = arena;
    this.index = arena.allocate();

    if (source instanceof HTMLElement) {
      this.enrich(thumbToPost(source));
    } else {
      this.enrich(source);
      arena.cacheTagSet(this, this.tags);
    }
  }

  public get id(): string {
    return String(this.arena.id(this.index));
  }

  public get tags(): Set<string> {
    return this.arena.tagSet(this, this.index);
  }

  public get post(): Post {
    return { ...this.arena.toPost(this.index), previewURL: compressPreviewSource(this.previewUrl) };
  }

  public get mediaType(): MediaType {
    return resolveMediaType(this.tags);
  }

  public get rating(): Rating {
    return this.arena.rating(this.index);
  }

  public get extension(): MediaExtension | undefined {
    return this.arena.extension(this.index);
  }

  public get thumbUrl(): string {
    return decompressPreviewSource(this.previewUrl);
  }

  public get root(): HTMLElement {
    return (this.element ??= this.createElement()).root;
  }

  public consumeTags(): Set<string> {
    const tags = this.tags;

    this.arena.evictTagSet(this);
    return tags;
  }

  public getMetric(metric: Metric): number {
    return this.arena.getMetric(this.index, metric);
  }

  public setDuration(duration: number): void {
    this.arena.setDuration(this.index, duration);
  }

  public enrich(post: Post): void {
    this.arena.write(this.index, post);
    this.previewUrl = compressPreviewSource(post.previewURL);
    this.element?.update(post.width, post.height, post.extension);
  }

  private createElement(): FavoritesElement {
    return new FavoritesElement(this.id, this.thumbUrl, this.mediaType, this.arena.width(this.index), this.arena.height(this.index), this.extension);
  }
}
