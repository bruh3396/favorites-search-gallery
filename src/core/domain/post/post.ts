import { Media } from "@/core/domain/media/media";
import { PostStatus } from "@/core/domain/post/post_status";
import { Rating } from "@/core/domain/post/rating";

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
  readonly status: PostStatus;
  readonly fetchedAt?: number;
};
