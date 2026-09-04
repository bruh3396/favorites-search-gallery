import { Post } from "@/types/api";
import { daysToMilliseconds } from "@/utils/pure/number";

const timeToLive = daysToMilliseconds(7);

export function postIsComplete(post: Post): boolean {
  return post.width > 0 && post.height > 0;
}

export function postIsStale(post: Post): boolean {
  return post.fetchedAt === undefined || Date.now() - post.fetchedAt > timeToLive;
}
