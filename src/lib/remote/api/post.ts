import { Post, PostResponse } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing_resolver";
import { DeletedPostError } from "@/types/errors";
import { fetchApi } from "@/lib/remote/api/gateway";
import { fetchPostPageHtml } from "@/lib/remote/rule34/posts/page";
import { parsePostFromPostPage } from "@/lib/remote/parsers/post_page";
import { parsePostResponse } from "@/lib/remote/parsers/post";
import { postLimiter } from "@/lib/remote/http/rate_limiters";

const postResolver = new CoalescingResolver<string, PostResponse>(ApiConfig.maxRequests, ApiConfig.requestFlushTimeout, fetchPosts);

export function fetchPost(id: string): Promise<Post> {
  return postResolver.schedule(id)
    .then(parsePostResponse)
    .catch((error: unknown) => {
      if (error instanceof DeletedPostError) {
        return fetchPostPageHtml(id).then(parsePostFromPostPage);
      }
      throw error;
    });
}

function fetchPosts(ids: string[]): Promise<Map<string, PostResponse>> {
  return postLimiter.run(() => fetchApi("post", { ids })
    .then(response => response.json() as Promise<Record<string, PostResponse>>)
    .then(record => new Map(Object.entries(record))));
}
