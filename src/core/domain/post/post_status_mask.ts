import { POST_STATUSES, PostStatus } from "@/core/domain/post/post_status";

export type PostStatusMask = number;

export const ALL_POST_STATUSES_MASK: PostStatusMask = (1 << POST_STATUSES.length) - 1;

export function toPostStatusMask(postStatus: PostStatus): PostStatusMask {
  return 1 << POST_STATUSES.indexOf(postStatus);
}

export function isPostStatusMask(value: unknown): value is PostStatusMask {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= ALL_POST_STATUSES_MASK;
}
