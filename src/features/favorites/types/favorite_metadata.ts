import { DiscreteRating, Rating, decodeRating } from "@/types/search";
import { FavoriteMetricMap, FavoriteDatabaseRecord, FavoriteMetadataDatabaseRecord } from "@/types/favorite";
import { Post } from "@/types/api";

export class FavoriteMetadata {
  public readonly metrics: FavoriteMetricMap;
  public readonly id: string;
  public rating: Rating;

  constructor(id: string, record: FavoriteDatabaseRecord | HTMLElement) {
    this.metrics = {id: parseInt(id, 10), width: 0, height: 0, score: 0, creationTimestamp: 0, lastChangedTimestamp: 0, default: 0, random: 0, duration: 0};
    this.id = id;
    this.rating = DiscreteRating.Explicit;

    if (!(record instanceof HTMLElement)) {
      this.populateFromDatabase(record);
    }
  }

  public get databaseRecord(): FavoriteMetadataDatabaseRecord {
    return {
      width: this.metrics.width,
      height: this.metrics.height,
      score: this.metrics.score,
      rating: this.rating,
      create: this.metrics.creationTimestamp,
      change: this.metrics.lastChangedTimestamp,
      duration: this.metrics.duration
    };
  }

  public get isUnpopulated(): boolean {
    return this.metrics.width === 0 && this.metrics.height === 0;
  }

  public populateFromPost(post: Post): void {
    this.metrics.width = post.width;
    this.metrics.height = post.height;
    this.metrics.score = post.score;
    this.metrics.creationTimestamp = 0;
    this.metrics.lastChangedTimestamp = post.change;
    this.rating = decodeRating(post.rating);
  }

  private populateFromDatabase(record: FavoriteDatabaseRecord): void {
    this.metrics.width = record.metadata.width;
    this.metrics.height = record.metadata.height;
    this.metrics.score = record.metadata.score;
    this.rating = record.metadata.rating as Rating;
    this.metrics.creationTimestamp = record.metadata.create;
    this.metrics.lastChangedTimestamp = record.metadata.change;
    this.metrics.duration = record.metadata.duration ?? 0;
  }
}
