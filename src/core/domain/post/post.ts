import { Media } from "@/core/domain/media/media";
import { TagCategoryMap } from "@/core/domain/tag/tag";

export const RATINGS = ["explicit", "questionable", "safe"] as const;
export const ALL_RATINGS_MASK = (1 << RATINGS.length) - 1;
export const METRICS = ["id", "score", "width", "height", "duration", "changedAt"] as const;
const metrics: ReadonlySet<unknown> = new Set(METRICS);

export type Rating = typeof RATINGS[number];
export type Metric = typeof METRICS[number];

export function isMetric(value: unknown): value is Metric {
  return metrics.has(value);
}

export function getRatingBit(rating: Rating): number {
  return 1 << RATINGS.indexOf(rating);
}

export function isRatingMask(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= ALL_RATINGS_MASK;
}

export type Post = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly rating: Rating;
  readonly changedAt: number;
  readonly media: Media;
  readonly tags: string;
  readonly durationSeconds?: number;
  readonly deleted?: boolean;
  readonly fetchedAt?: number;
};

export type CategorizedPost = {
  readonly post: Post;
  readonly tagCategories: TagCategoryMap;
};

export type Dimensions = Pick<Post, "width" | "height">;

export type MediaItem = Pick<Post, "id" | "media">;
