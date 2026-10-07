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
  id: string;
  width: number;
  height: number;
  score: number;
  rating: Rating;
  changedAt: number;
  media: Media;
  tags: string;
  durationSeconds?: number;
  deleted?: boolean;
  fetchedAt?: number;
};

export type CategorizedPost = {
  post: Post;
  tagCategories: TagCategoryMap;
};

export type MediaItem = Pick<Post, "id" | "media">;

export type Dimensions = Pick<Post, "width" | "height">;
