import { Post } from "../../../types/api";
import { SlimPost } from "../../../types/api";
import { generalPageRequestQueue, multiPostLimiter } from "../http/rate_limiter";
import { CoalescingExecutor } from "../../core/concurrency/coalescing_executor";
import { MULTI_POST_SLIM_API_URL } from "../url/api_url_builder";
import { buildPostPageURL } from "../url/page_url_builder";
import { fetchHtml } from "../http/http_client";
import { parsePostFromPostPage } from "../parse/post_page_parser";
import { postToServer } from "./server_client";
import { slimPostToPost } from "../parse/api_post_parser";

type PostResolver = { resolve: (post: Post) => void; reject: (reason: unknown) => void };

const MULTI_POST_BATCH_SIZE = 50;
const MULTI_POST_FLUSH_DELAY = 1250;

const pendingPosts = new Map<string, PostResolver>();
const postBatchExecutor = new CoalescingExecutor<string>(MULTI_POST_BATCH_SIZE, MULTI_POST_FLUSH_DELAY, flushPostBatch);

async function fetchSlimPosts(ids: string[]): Promise<Record<string, SlimPost>> {
  const response = await postToServer(MULTI_POST_SLIM_API_URL, { ids });
  return response.json() as Promise<Record<string, SlimPost>>;
}

function resolvePostBatch(data: Record<string, SlimPost>): void {
  for (const [id, slim] of Object.entries(data)) {
    pendingPosts.get(id)?.resolve(slimPostToPost(slim));
    pendingPosts.delete(id);
  }
}

function rejectPostBatch(ids: string[], error: unknown): void {
  for (const id of ids) {
    pendingPosts.get(id)?.reject(error);
    pendingPosts.delete(id);
  }
}

function flushPostBatch(ids: string[]): void {
  multiPostLimiter.run(async() => resolvePostBatch(await fetchSlimPosts(ids)))
    .catch((error: unknown) => rejectPostBatch(ids, error));
}

function fetchPostFromAPI(id: string): Promise<Post> {
  return new Promise<Post>((resolve, reject) => {
    pendingPosts.set(id, { resolve, reject });
    postBatchExecutor.add(id);
  });
}

export function fetchPostFromAPISafe(id: string): Promise<Post> {
  return fetchPostFromAPI(id).catch(fetchPostFromPostPage);
}

export function fetchMultiplePostsFromAPI(ids: string[]): Promise<Record<string, Post>> {
  return Promise.all(ids.map(async(id) => [id, await fetchPostFromAPI(id)]))
    .then(entries => Object.fromEntries(entries));
}

function fetchPostFromPostPage(id: string): Promise<Post> {
  return fetchPostPage(id).then(parsePostFromPostPage);
}

export async function fetchPostPage(id: string): Promise<string> {
  await generalPageRequestQueue.wait();
  return fetchHtml(buildPostPageURL(id));
}
