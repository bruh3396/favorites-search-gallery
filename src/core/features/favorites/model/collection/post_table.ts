import { MEDIA_KINDS, Media } from "@/core/domain/media/media";
import { Metric, Post, RATINGS, Rating } from "@/core/domain/post/post";
import { assertNever } from "@/core/utils/guards/guards";
import { grow } from "@/core/utils/collection/array";

const INITIAL_CAPACITY = 1_024;

export class FavoritesPostTable {
  private ids = new Uint32Array(INITIAL_CAPACITY);
  private widths = new Uint16Array(INITIAL_CAPACITY);
  private heights = new Uint16Array(INITIAL_CAPACITY);
  private scores = new Uint32Array(INITIAL_CAPACITY);
  private mediaKinds = new Uint8Array(INITIAL_CAPACITY);
  private durationSeconds = new Uint16Array(INITIAL_CAPACITY);
  private changedAts = new Float64Array(INITIAL_CAPACITY);
  private ratings = new Uint8Array(INITIAL_CAPACITY);
  private mediaLocators: string[] = [];

  public write(slot: number, post: Post): void {
    this.ids[slot] = parseInt(post.id, 10);
    this.widths[slot] = post.width;
    this.heights[slot] = post.height;
    this.scores[slot] = post.score;
    this.changedAts[slot] = post.changedAt;
    this.durationSeconds[slot] = post.durationSeconds ?? 0;
    this.ratings[slot] = RATINGS.indexOf(post.rating);
    this.mediaKinds[slot] = MEDIA_KINDS.indexOf(post.media.kind);
    this.mediaLocators[slot] = post.media.locator;
  }

  public getMetric(slot: number, metric: Metric): number {
    switch (metric) {
      case "id":
        return this.ids[slot];
      case "width":
        return this.widths[slot];
      case "height":
        return this.heights[slot];
      case "score":
        return this.scores[slot];
      case "changedAt":
        return this.changedAts[slot];
      case "duration":
        return this.durationSeconds[slot];
      default:
        return assertNever(metric);
    }
  }

  public getTaglessPost(slot: number): Omit<Post, "tags"> {
    const durationSeconds = this.durationSeconds[slot];
    return {
      id: String(this.ids[slot]),
      width: this.widths[slot],
      height: this.heights[slot],
      score: this.scores[slot],
      rating: this.getRating(slot),
      changedAt: this.changedAts[slot],
      media: this.getMedia(slot),
      ...(durationSeconds === 0 ? {} : { durationSeconds })
    };
  }

  public getNumericId(slot: number): number {
    return this.ids[slot];
  }

  public getRating(slot: number): Rating {
    return RATINGS[this.ratings[slot]];
  }

  public getMedia(slot: number): Media {
    return { kind: MEDIA_KINDS[this.mediaKinds[slot]] ?? "image", locator: this.mediaLocators[slot] ?? "" };
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
    this.mediaKinds = grow(this.mediaKinds, capacity);
    this.durationSeconds = grow(this.durationSeconds, capacity);
    this.changedAts = grow(this.changedAts, capacity);
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
    this.mediaKinds = this.mediaKinds.slice(0, count);
    this.durationSeconds = this.durationSeconds.slice(0, count);
    this.changedAts = this.changedAts.slice(0, count);
    this.ratings = this.ratings.slice(0, count);
    this.mediaLocators.length = count;
  }
}
