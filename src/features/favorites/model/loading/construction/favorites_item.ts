import { MediaExtension, MediaType, decodeMediaExtension, encodeMediaExtension } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { compressPreviewSource, decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { toRatingString, toRatingValue } from "@/features/favorites/model/search/rating";
import { Favorite } from "@/types/favorite";
import { FavoritesArena } from "@/features/favorites/model/loading/construction/favorites_arena";
import { FavoritesElement } from "@/features/favorites/model/loading/construction/favorites_element";
import { Post } from "@/types/api";
import { internString } from "@/lib/search/interner";
import { resolveMediaType } from "@/lib/media/media_type";
import { thumbToPost } from "@/features/favorites/model/loading/construction/thumb_to_post";
import { toTagSet } from "@/utils/pure/tag";

const arena = new FavoritesArena();

export class FavoritesItem implements Favorite {
  private readonly index: number;
  private previewUrl: string = "";
  private element: FavoritesElement | null = null;

  constructor(source: HTMLElement | Post) {
    const post = source instanceof HTMLElement ? thumbToPost(source) : source;

    this.index = arena.allocate();
    arena.ids[this.index] = parseInt(post.id, 10);
    this.enrich(post);

    if (!(source instanceof HTMLElement)) {
      arena.tagSets.set(this, this.tags);
    }
  }

  public get id(): string {
    return String(arena.ids[this.index]);
  }

  public get tags(): Set<string> {
    return arena.tagSets.get(this) ?? toTagSet(this.tagsString);
  }

  public get mediaType(): MediaType {
    return resolveMediaType(this.tags);
  }

  public get post(): Post {
    return {
      id: this.id,
      tags: this.tagsString,
      width: arena.widths[this.index],
      height: arena.heights[this.index],
      score: arena.scores[this.index],
      rating: toRatingString(arena.ratings[this.index] as Rating),
      change: arena.changes[this.index],
      fileURL: "",
      duration: arena.durations[this.index],
      fetchedAt: arena.fetchedAt[this.index],
      deleted: arena.deleted[this.index] === 1,
      previewURL: compressPreviewSource(this.previewUrl),
      extension: this.extension
    };
  }

  public get rating(): Rating {
    return arena.ratings[this.index] as Rating;
  }

  public get extension(): MediaExtension | undefined {
    return decodeMediaExtension(arena.encodedMediaExtensions[this.index]);
  }

  public get thumbUrl(): string {
    return decompressPreviewSource(this.previewUrl);
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoritesElement(this.id, this.thumbUrl, this.mediaType);
      this.element.setAspectRatio(arena.widths[this.index], arena.heights[this.index]);
      this.element.setExtension(this.extension);
    }
    return this.element.root;
  }

  private get tagsString(): string {
    return arena.loadTags({ offset: arena.tagOffsets[this.index], count: arena.tagCounts[this.index] });
  }

  public consumeTags(): Set<string> {
    const tags = this.tags;

    arena.tagSets.delete(this);
    return tags;
  }

  public getMetric(metric: Metric): number {
    switch (metric) {
      case "id":
        return arena.ids[this.index];
      case "width":
        return arena.widths[this.index];
      case "height":
        return arena.heights[this.index];
      case "score":
        return arena.scores[this.index];
      case "lastChangedTimestamp":
        return arena.changes[this.index];
      case "duration":
        return arena.durations[this.index];
      case "creationTimestamp":
      case "default":
      case "random":
      default:
        return 0;
    }
  }

  public setDuration(duration: number): void {
    arena.durations[this.index] = duration;
  }

  public enrich(post: Post): void {
    arena.widths[this.index] = post.width;
    arena.heights[this.index] = post.height;
    arena.scores[this.index] = post.score;
    arena.changes[this.index] = post.change;
    arena.durations[this.index] = post.duration ?? 0;
    arena.fetchedAt[this.index] = post.fetchedAt ?? 0;
    arena.ratings[this.index] = toRatingValue(post.rating);
    arena.deleted[this.index] = post.deleted ? 1 : 0;
    arena.encodedMediaExtensions[this.index] = encodeMediaExtension(post.extension ? internString(post.extension) as MediaExtension : post.extension);
    this.previewUrl = compressPreviewSource(post.previewURL);
    this.element?.setAspectRatio(post.width, post.height);
    this.element?.setExtension(post.extension);
    const tagSpan = arena.storeTags(post.tags);

    arena.tagOffsets[this.index] = tagSpan.offset;
    arena.tagCounts[this.index] = tagSpan.count;
  }
}
