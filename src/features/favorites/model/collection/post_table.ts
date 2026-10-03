import { DiscreteRating, Metric, Rating } from "@/types/search";
import { Media, MediaKind } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { grow } from "@/utils/pure/array";

const DEFAULT_CAPACITY = 1_024;
const MEDIA_KINDS: readonly MediaKind[] = ["image", "video", "gif"];

export class FavoritesPostTable {
  private ids = new Uint32Array(DEFAULT_CAPACITY);
  private widths = new Uint16Array(DEFAULT_CAPACITY);
  private heights = new Uint16Array(DEFAULT_CAPACITY);
  private scores = new Uint32Array(DEFAULT_CAPACITY);
  private deleted = new Uint8Array(DEFAULT_CAPACITY);
  private isNew = new Uint8Array(DEFAULT_CAPACITY);
  private mediaKinds = new Uint8Array(DEFAULT_CAPACITY);
  private durationSeconds = new Uint16Array(DEFAULT_CAPACITY);
  private changedAts = new Float64Array(DEFAULT_CAPACITY);
  private fetchedAts = new Float64Array(DEFAULT_CAPACITY);
  private ratings = new Uint8Array(DEFAULT_CAPACITY);
  private mediaLocators: string[] = [];

  public write(index: number, post: Post): void {
    this.ids[index] = parseInt(post.id, 10);
    this.widths[index] = post.width;
    this.heights[index] = post.height;
    this.scores[index] = post.score;
    this.changedAts[index] = post.changedAt;
    this.durationSeconds[index] = post.durationSeconds ?? 0;
    this.fetchedAts[index] = post.fetchedAt ?? 0;
    this.ratings[index] = toRatingValue(post.rating);
    this.deleted[index] = post.deleted ? 1 : 0;
    this.mediaKinds[index] = MEDIA_KINDS.indexOf(post.media.kind);
    this.mediaLocators[index] = post.media.locator;
  }

  public toPost(index: number, tags: string): Post {
    return {
      id: String(this.ids[index]),
      tags,
      width: this.widths[index],
      height: this.heights[index],
      score: this.scores[index],
      rating: toRatingString(this.ratings[index] as Rating),
      changedAt: this.changedAts[index],
      durationSeconds: this.durationSeconds[index],
      fetchedAt: this.fetchedAts[index],
      deleted: this.deleted[index] === 1,
      media: this.media(index)
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
        return this.changedAts[index];
      case "duration":
        return this.durationSeconds[index];
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

  public media(index: number): Media {
    return { kind: MEDIA_KINDS[this.mediaKinds[index]] ?? "image", locator: this.mediaLocators[index] ?? "" };
  }

  public isNewItem(index: number): boolean {
    return this.isNew[index] === 1;
  }

  public markNew(index: number): void {
    this.isNew[index] = 1;
  }

  public setDurationSeconds(index: number, durationSeconds: number): void {
    this.durationSeconds[index] = durationSeconds;
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
    this.mediaKinds = grow(this.mediaKinds, capacity);
    this.durationSeconds = grow(this.durationSeconds, capacity);
    this.changedAts = grow(this.changedAts, capacity);
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
    this.mediaKinds = this.mediaKinds.slice(0, count);
    this.durationSeconds = this.durationSeconds.slice(0, count);
    this.changedAts = this.changedAts.slice(0, count);
    this.fetchedAts = this.fetchedAts.slice(0, count);
    this.ratings = this.ratings.slice(0, count);
    this.mediaLocators.length = count;
  }
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
