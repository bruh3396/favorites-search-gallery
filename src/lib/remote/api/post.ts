import { Post, PostResponse } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing";
import { PostFetchError } from "@/types/errors";
import { fetchApi } from "@/lib/remote/api/gateway";
import { fetchPostPageHtml } from "@/lib/remote/rule34/posts/page";
import { parsePost } from "@/lib/remote/parsers/post";
import { parsePostFromPostPage } from "@/lib/remote/parsers/post_page";
import { postLimiter } from "@/lib/remote/http/rate_limiters";

const postResolver = new CoalescingResolver<string, PostResponse>(ApiConfig.coalesceSize, ApiConfig.flushTimeout, fetchPosts);

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

function fetchPosts(ids: string[]): Promise<Map<string, PostResponse>> {
  return postLimiter.run(() => fetchApi("post", { ids })
    .then(response => response.json() as Promise<Record<string, PostResponse>>)
    .then(record => new Map(Object.entries(record))));
}
