import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

export const UNCHANGED_REMOTE_FAVORITES: RemoteFavorites = {
  fetchCount: () => Promise.resolve(null),
  fetchAll: () => Promise.resolve(),
  findNew: () => Promise.resolve([]),
  findMissing: () => Promise.resolve([]),
  add: () => Promise.resolve(false),
  remove: () => Promise.resolve(false)
};

export const UNAVAILABLE_REMOTE_POSTS: RemotePosts = {
  fetch: post => Promise.reject(new PostUnavailableError(post.id))
};
