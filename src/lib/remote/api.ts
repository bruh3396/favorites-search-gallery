import { PLATFORM, USER_ID, VERSION } from "@/lib/environment";
import { PostResponse, Route, TagResponse } from "@/types/api";
import { Post } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing";
import { LocalOverrides } from "@/config/local_overrides";
import { PostFetchError } from "@/types/errors";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { TagCategory } from "@/types/search";
import { decodeTagCategory } from "@/lib/remote/parsers/tag";
import { fetchPostPageHtml } from "@/lib/remote/pages";
import { parsePost } from "@/lib/remote/parsers/post";
import { parsePostFromPostPage } from "@/lib/remote/parsers/post_page";

const PRODUCTION_SERVER_ORIGIN = "https://frozencobalt.stream";
const SERVER_ORIGIN = LocalOverrides.serverOrigin ?? PRODUCTION_SERVER_ORIGIN;
const REQUEST_INIT: RequestInit = { method: "POST", headers: { "X-User-Id": USER_ID, "X-Version": VERSION, "X-Platform": PLATFORM } };

const postLimiter = new RateLimiter(ApiConfig.postRateLimit);
const tagLimiter = new RateLimiter(ApiConfig.tagRateLimit);

const postResolver = new CoalescingResolver<string, PostResponse>(ApiConfig.coalesceSize, ApiConfig.flushTimeout, fetchPosts);
const tagResolver = new CoalescingResolver<string, TagResponse>(ApiConfig.coalesceSize, ApiConfig.flushTimeout, fetchTagCategories);

export function ping(): void {
  fetchApi("ping");
}

export function fetchPost(id: string, onDeleted?: () => void): Promise<Post> {
  return postResolver.schedule(id).then(response => {
    switch (response.status) {
      case "ok":
        return parsePost(response.post);
      case "deferred":
        return fetchPost(id, onDeleted);
      case "deleted":
        onDeleted?.();
        return fetchDeletedPost(id);
      case "rate_limited":
      case "error":
      default:
        throw new PostFetchError(response.status);
    }
  });
}

export function fetchDeletedPost(id: string): Promise<Post> {
  return fetchPostPageHtml(id).then(parsePostFromPostPage);
}

export function fetchTagCategory(tagName: string): Promise<TagCategory> {
  return tagResolver.schedule(tagName).then((response) => {
    if (response.status === "rate_limited") {
      throw new PostFetchError();
    }
    return decodeTagCategory(response.category);
  });
}

function fetchPosts(ids: string[]): Promise<Map<string, PostResponse>> {
  return postLimiter.run(() => fetchRecordAsMap<PostResponse>("post", { ids }));
}

function fetchTagCategories(tagNames: string[]): Promise<Map<string, TagResponse>> {
  return tagLimiter.run(() => fetchRecordAsMap<TagResponse>("tag", { tagNames }));
}

function fetchRecordAsMap<T>(route: Route, body: Record<string, unknown>): Promise<Map<string, T>> {
  return fetchApi(route, body)
    .then(response => response.json() as Promise<Record<string, T>>)
    .then(record => new Map(Object.entries(record)));
}

function fetchApi(route: Route, body: Record<string, unknown> = {}): Promise<Response> {
  return fetch(`${SERVER_ORIGIN}/${route}`, { ...REQUEST_INIT, body: JSON.stringify(body) });
}
