import { Post } from "@/core/domain/post/post";

export const MEDIA_KINDS = ["image", "video", "gif"] as const;

export type MediaKind = typeof MEDIA_KINDS[number];

export interface Media {
  readonly kind: MediaKind;
  readonly locator: string;
}
export type MediaItem = Pick<Post, "id" | "media">;
