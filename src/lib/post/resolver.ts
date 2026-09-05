import * as PostStore from "@/lib/post/store";
import { ParsedPost, Post } from "@/types/api";
import { allMediaExtensions, extensionRegex } from "@/lib/media/constants";
import { fetchDeletedPost, fetchPost } from "@/lib/remote/api";
import { ApiConfig } from "@/config/api_config";
import { MediaExtension } from "@/types/media";
import { postIsComplete } from "@/lib/post/status";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export async function resolveAll(stalePosts: Post[], onResolved: (resolved: ParsedPost) => void): Promise<void> {
  const cached = await readCached(stalePosts.map(post => post.id));

  await Promise.all(stalePosts.map(async post => {
    onResolved(await resolve(post, cached.get(post.id)));
  }));
}

async function resolve(stale: Post, cached: Post | undefined): Promise<ParsedPost> {
  if (cached !== undefined) {
    return { post: cached, tagCategories: new Map() };
  }
  const latest = await fetchLatest(stale);

  if (!postIsComplete(latest.post)) {
    return { post: stale, tagCategories: latest.tagCategories };
  }
  const complete = { ...stale, ...withExtension(latest.post), fetchedAt: Date.now() };

  PostStore.write(complete);
  return { post: complete, tagCategories: latest.tagCategories };
}

async function readCached(postIds: string[]): Promise<Map<string, Post>> {
  const cached = await PostStore.readMany(postIds);
  return new Map(cached.map(post => [post.id, post]));
}

function fetchLatest(post: Post): Promise<ParsedPost> {
  return withExponentialBackoff(async() => {
    if (post.deleted) {
      return fetchDeletedPost(post.id);
    }
    let isDeleted = false;
    const latest = await fetchPost(post.id, () => {
      isDeleted = true;
    });
    return isDeleted ? { ...latest, post: { ...latest.post, deleted: true } } : latest;
  }, ApiConfig.postRetries);
}

function withExtension(post: Post): Post {
  const extension = extractExtension(post.fileURL);
  return extension === null ? post : { ...post, extension };
}

function extractExtension(fileURL: string): MediaExtension | null {
  const match = extensionRegex.exec(fileURL)?.[1];
  return match !== undefined && allMediaExtensions.includes(match as MediaExtension) ? match as MediaExtension : null;
}
