import { DiscreteRating, Metric, Rating } from "@/types/search";
import { MediaExtension, decodeMediaExtension, encodeMediaExtension } from "@/types/media";
import { Post } from "@/types/api";
import { WIMG_ORIGIN } from "@/lib/constants";
import { copyString } from "@/utils/pure/string";
import { grow } from "@/utils/pure/array";
import { internString } from "@/lib/search/interner";
import { isUrl } from "@/utils/pure/url";

const DEFAULT_CAPACITY = 1024;

export class FavoritesPostTable {
  private ids = new Uint32Array(DEFAULT_CAPACITY);
  private widths = new Uint16Array(DEFAULT_CAPACITY);
  private heights = new Uint16Array(DEFAULT_CAPACITY);
  private scores = new Uint32Array(DEFAULT_CAPACITY);
  private deleted = new Uint8Array(DEFAULT_CAPACITY);
  private isNew = new Uint8Array(DEFAULT_CAPACITY);
  private encodedExtensions = new Uint8Array(DEFAULT_CAPACITY);
  private durations = new Uint16Array(DEFAULT_CAPACITY);
  private changes = new Float64Array(DEFAULT_CAPACITY);
  private fetchedAts = new Float64Array(DEFAULT_CAPACITY);
  private ratings = new Uint8Array(DEFAULT_CAPACITY);
  private previewSources: string[] = [];

  public write(index: number, post: Post): void {
    this.ids[index] = parseInt(post.id, 10);
    this.widths[index] = post.width;
    this.heights[index] = post.height;
    this.scores[index] = post.score;
    this.changes[index] = post.change;
    this.durations[index] = post.duration ?? 0;
    this.fetchedAts[index] = post.fetchedAt ?? 0;
    this.ratings[index] = toRatingValue(post.rating);
    this.deleted[index] = post.deleted ? 1 : 0;
    this.encodedExtensions[index] = encodeMediaExtension(post.extension ? internString(post.extension) as MediaExtension : post.extension);
    this.previewSources[index] = compressPreviewSource(post.previewURL);
  }

  public toPost(index: number, tags: string): Post {
    return {
      id: String(this.ids[index]),
      tags,
      width: this.widths[index],
      height: this.heights[index],
      score: this.scores[index],
      rating: toRatingString(this.ratings[index] as Rating),
      change: this.changes[index],
      fileURL: "",
      duration: this.durations[index],
      fetchedAt: this.fetchedAts[index],
      deleted: this.deleted[index] === 1,
      previewURL: this.previewSources[index] ?? "",
      extension: this.extension(index)
    };
  }

  public getMetric(index: number, metric: Metric): number {
    switch (metric) {
      case "id":
        return this.ids[index];
      case "width":
        return this.widths[index];
      case "height":
        return this.heights[index];
      case "score":
        return this.scores[index];
      case "lastChangedTimestamp":
        return this.changes[index];
      case "duration":
        return this.durations[index];
      case "creationTimestamp":
      case "default":
      case "random":
      default:
        return 0;
    }
  }

  public id(index: number): number {
    return this.ids[index];
  }

  public rating(index: number): Rating {
    return this.ratings[index] as Rating;
  }

  public extension(index: number): MediaExtension | undefined {
    return decodeMediaExtension(this.encodedExtensions[index]);
  }

  public isNewItem(index: number): boolean {
    return this.isNew[index] === 1;
  }

  public previewUrl(index: number): string {
    return decompressPreviewSource(this.previewSources[index] ?? "");
  }

  public markNew(index: number): void {
    this.isNew[index] = 1;
  }

  public setDuration(index: number, duration: number): void {
    this.durations[index] = duration;
  }

  public ensureCapacity(required: number): void {
    if (required <= this.ids.length) {
      return;
    }

    const capacity = Math.max(this.ids.length * 2, required);

    this.ids = grow(this.ids, capacity);
    this.widths = grow(this.widths, capacity);
    this.heights = grow(this.heights, capacity);
    this.scores = grow(this.scores, capacity);
    this.deleted = grow(this.deleted, capacity);
    this.isNew = grow(this.isNew, capacity);
    this.encodedExtensions = grow(this.encodedExtensions, capacity);
    this.durations = grow(this.durations, capacity);
    this.changes = grow(this.changes, capacity);
    this.fetchedAts = grow(this.fetchedAts, capacity);
    this.ratings = grow(this.ratings, capacity);
  }

  public trim(count: number): void {
    if (count === this.ids.length) {
      return;
    }
    this.ids = this.ids.slice(0, count);
    this.widths = this.widths.slice(0, count);
    this.heights = this.heights.slice(0, count);
    this.scores = this.scores.slice(0, count);
    this.deleted = this.deleted.slice(0, count);
    this.isNew = this.isNew.slice(0, count);
    this.encodedExtensions = this.encodedExtensions.slice(0, count);
    this.durations = this.durations.slice(0, count);
    this.changes = this.changes.slice(0, count);
    this.fetchedAts = this.fetchedAts.slice(0, count);
    this.ratings = this.ratings.slice(0, count);
    this.previewSources.length = count;
  }
}

const previewSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;

export function decompressPreviewSource(compressedSource: string): string {
  if (isUrl(compressedSource)) {
    return compressedSource;
  }
  const splitSource = compressedSource.split("_").map(copyString);
  return `${WIMG_ORIGIN}/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  if (!isUrl(source)) {
    return source;
  }
  const match = source.match(previewSourceCompressionRegex);
  return match === null ? source : match.splice(1).join("_");
}

export function toRatingValue(rating: string): Rating {
  switch (rating.charAt(0).toLowerCase()) {
    case "s":
      return DiscreteRating.Safe;
    case "q":
      return DiscreteRating.Questionable;
    default:
      return DiscreteRating.Explicit;
  }
}

export function toRatingString(rating: Rating): string {
  switch (rating) {
    case DiscreteRating.Safe:
      return "s";
    case DiscreteRating.Questionable:
      return "q";
    default:
      return "e";
  }
}
