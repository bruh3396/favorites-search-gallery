import { FrozenCobaltPost, isFrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { isRecord } from "@/core/utils/guard/unknown_utilities";

export interface CachePage {
  readonly frozenCobaltPosts: readonly FrozenCobaltPost[];
  readonly next: number | null;
}

const CACHE_URL = "http://localhost:8787/cache?user_id=0";
const HEADERS = { "Content-Type": "text/plain" };

export async function fetchCachePage(after: number): Promise<CachePage> {
  const response = await fetch(CACHE_URL, { method: "POST", headers: HEADERS, body: JSON.stringify({ after }) });

  if (!response.ok) {
    throw new Error(`Local Frozen Cobalt answered ${response.status}`);
  }
  const page: unknown = await response.json();

  if (!isRecord(page) || !Array.isArray(page.posts) || !page.posts.every(isFrozenCobaltPost) || !(page.next === null || typeof page.next === "number")) {
    throw new Error("Local Frozen Cobalt sent a malformed page");
  }
  return { frozenCobaltPosts: page.posts, next: page.next };
}
