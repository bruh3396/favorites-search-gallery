import * as PostStore from "@/lib/post/store";
import { allMediaExtensions, extensionRegex } from "@/lib/media/constants";
import { fetchDeletedPost, fetchPost } from "@/lib/remote/api";
import { ApiConfig } from "@/config/api_config";
import { MediaExtension } from "@/types/media";
import { Post } from "@/types/api";
import { postIsComplete } from "@/lib/post/status";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export async function resolvePosts(posts: Post[], onResolved: (post: Post) => void): Promise<void> {
  const cached = await readCache(posts);

  await Promise.all(posts.map(async post => {
    onResolved(await resolve(post, cached.get(post.id)));
  }));
}

async function resolve(post: Post, cached: Post | undefined): Promise<Post> {
  if (cached !== undefined) {
    return cached;
  }
  const resolved = await fetchComplete(post);

  if (!postIsComplete(resolved)) {
    return post;
  }
  const complete = { ...post, ...withExtension(resolved), fetchedAt: Date.now() };

  PostStore.write(complete);
  return complete;
}

async function readCache(posts: Post[]): Promise<Map<string, Post>> {
  const postIds = posts.map(post => post.id);
  const cached = await PostStore.readMany(postIds);
  return new Map(cached.map(post => [post.id, post]));
}

function fetchComplete(post: Post): Promise<Post> {
  return withExponentialBackoff(async() => {
    if (post.deleted) {
      return fetchDeletedPost(post.id);
    }
    let isDeleted = false;
    const fetched = await fetchPost(post.id, () => {
      isDeleted = true;
    });
    return isDeleted ? { ...fetched, deleted: true } : fetched;
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
