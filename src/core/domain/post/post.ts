import { Media } from "@/core/domain/media/media";
import { TagCategoryMap } from "@/core/domain/tag/tag";

const TIME_TO_LIVE = 28 * 24 * 60 * 60 * 1_000;

export type Post = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  change: number;
  media: Media;
  tags: string;
  duration?: number;
  deleted?: boolean;
  fetchedAt?: number;
};

export type CategorizedPost = {
  post: Post;
  tagCategories: TagCategoryMap;
};

export type PostMedia =Pick<Post, "id" | "media">;

export function postHasDimensions(post: Post): boolean {
  return post.width > 0 && post.height > 0;
}

export function postIsStale(post: Post): boolean {
  return post.fetchedAt === undefined || Date.now() - post.fetchedAt > TIME_TO_LIVE;
}
