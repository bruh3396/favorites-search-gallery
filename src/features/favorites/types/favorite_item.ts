import { MediaExtension, MediaType, decodeMediaExtension, encodeMediaExtension, mediaExtensionToType } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { compressPreviewSource, decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { loadTags, storeTags } from "@/app/domain/tag/tag_map";
import { toRatingString, toRatingValue } from "@/features/favorites/model/search/rating";
import { Favorite } from "@/types/favorite";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { Post } from "@/types/api";
import { internString } from "@/app/domain/tag/interner";
import { thumbToPost } from "@/features/favorites/types/thumb_to_post";
import { toTagSet } from "@/utils/pure/tag";

const DEFAULT_FAVORITE_COUNT = 1024;
let ids = new Uint32Array(DEFAULT_FAVORITE_COUNT);
let widths = new Uint16Array(DEFAULT_FAVORITE_COUNT);
let heights = new Uint16Array(DEFAULT_FAVORITE_COUNT);
let scores = new Uint32Array(DEFAULT_FAVORITE_COUNT);
let deleted = new Uint8Array(DEFAULT_FAVORITE_COUNT);
let encodedMediaExtensions = new Uint8Array(DEFAULT_FAVORITE_COUNT);
let durations = new Uint16Array(DEFAULT_FAVORITE_COUNT);
let changes = new Float64Array(DEFAULT_FAVORITE_COUNT);
let fetchedAt = new Float64Array(DEFAULT_FAVORITE_COUNT);
let ratings = new Uint8Array(DEFAULT_FAVORITE_COUNT);
let tagOffsets = new Uint32Array(DEFAULT_FAVORITE_COUNT);
let tagCounts = new Uint16Array(DEFAULT_FAVORITE_COUNT);
let favoriteCount = 0;
const tagSets = new WeakMap<FavoriteItem, Set<string>>();

function ensureCapacity(required: number): void {
  if (required <= ids.length) {
    return;
  }

  const capacity = Math.max(ids.length * 2, required);

  [ids, widths, heights, scores, changes, durations, fetchedAt, ratings, deleted, encodedMediaExtensions, tagOffsets, tagCounts] =
    [ids, widths, heights, scores, changes, durations, fetchedAt, ratings, deleted, encodedMediaExtensions, tagOffsets, tagCounts]
      .map(array => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const next = new (array.constructor as any)(capacity);

        next.set(array);
        return next;
      });
}

export class FavoriteItem implements Favorite {
  private readonly index;
  private previewUrl: string = "";
  private element: FavoriteElement | null = null;

  constructor(source: HTMLElement | Post) {
    const post = source instanceof HTMLElement ? thumbToPost(source) : source;

    ensureCapacity(favoriteCount + 1);
    this.index = favoriteCount;
    favoriteCount += 1;
    ids[this.index] = parseInt(post.id, 10);
    this.enrich(post);
    tagSets.set(this, this.tags);
  }

  public get id(): string {
    return String(ids[this.index]);
  }

  public get tags(): Set<string> {
    const tags = tagSets.get(this);

    if (tags === undefined) {
      return toTagSet(this.tagsString);
    }
    tagSets.delete(this);
    return tags;
  }

  public get post(): Post {
    return {
      id: this.id,
      tags: this.tagsString,
      width: widths[this.index],
      height: heights[this.index],
      score: scores[this.index],
      rating: toRatingString(ratings[this.index] as Rating),
      change: changes[this.index],
      fileURL: "",
      duration: durations[this.index],
      fetchedAt: fetchedAt[this.index],
      deleted: deleted[this.index] === 1,
      previewURL: compressPreviewSource(this.previewUrl),
      extension: this.extension
    };
  }

  public get rating(): Rating {
    return ratings[this.index] as Rating;
  }

  public get mediaType(): MediaType {
    return mediaExtensionToType(this.extension);
  }

  public get extension(): MediaExtension | undefined {
    return decodeMediaExtension(encodedMediaExtensions[this.index]);
  }

  public get thumbUrl(): string {
    return decompressPreviewSource(this.previewUrl);
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteElement(this.id, this.thumbUrl, this.mediaType);
      this.element.setAspectRatio(widths[this.index], heights[this.index]);
      this.element.setExtension(this.extension);
    }
    return this.element.root;
  }

  private get tagsString(): string {
    return loadTags({ offset: tagOffsets[this.index], count: tagCounts[this.index] });
  }

  public getMetric(metric: Metric): number {
    switch (metric) {
      case "id":
        return ids[this.index];
      case "width":
        return widths[this.index];
      case "height":
        return heights[this.index];
      case "score":
        return scores[this.index];
      case "lastChangedTimestamp":
        return changes[this.index];
      case "duration":
        return durations[this.index];
      case "creationTimestamp":
      case "default":
      case "random":
      default:
        return 0;
    }
  }

  public setDuration(duration: number): void {
    durations[this.index] = duration;
  }

  public enrich(post: Post): void {
    widths[this.index] = post.width;
    heights[this.index] = post.height;
    scores[this.index] = post.score;
    changes[this.index] = post.change;
    durations[this.index] = post.duration ?? 0;
    fetchedAt[this.index] = post.fetchedAt ?? 0;
    ratings[this.index] = toRatingValue(post.rating);
    deleted[this.index] = post.deleted ? 1 : 0;
    encodedMediaExtensions[this.index] = encodeMediaExtension(post.extension ? internString(post.extension) as MediaExtension : post.extension);
    this.previewUrl = compressPreviewSource(post.previewURL);
    this.element?.setAspectRatio(post.width, post.height);
    this.element?.setExtension(post.extension);
    const tagSpan = storeTags(post.tags);

    tagOffsets[this.index] = tagSpan.offset;
    tagCounts[this.index] = tagSpan.count;
  }
}
