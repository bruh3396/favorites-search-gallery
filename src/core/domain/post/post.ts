import { Media } from "@/core/domain/media/media";
import { TagCategoryMap } from "@/core/domain/tag/tag";

export type Post = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
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

export type PostMedia =Pick<Post, "id" | "media">;
