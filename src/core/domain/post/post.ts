import { MediaExtension } from "@/core/domain/media/extension";

const TIME_TO_LIVE = 28 * 24 * 60 * 60 * 1_000;

export type Post = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  change: number;
  fileURL: string;
  previewURL: string;
  tags: string;
  duration?: number;
  deleted?: boolean;
  extension?: MediaExtension;
  fetchedAt?: number;
};

export function postIsComplete(post: Post): boolean {
  return post.width > 0 && post.height > 0;
}

export function postIsStale(post: Post): boolean {
  return post.fetchedAt === undefined || Date.now() - post.fetchedAt > TIME_TO_LIVE;
}
