import { PostUnavailableError, RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

export const UNCHANGED_REMOTE_FAVORITES: RemoteFavorites = {
  fetchCount: () => Promise.resolve(null),
  fetchAll: () => Promise.resolve(),
  findNew: () => Promise.resolve([]),
  findRemoved: () => Promise.resolve([])
};

export const UNAVAILABLE_REMOTE_POSTS: RemotePosts = {
  fetch: post => Promise.reject(new PostUnavailableError(post.id))
};

export const BLOCKED_REMOTE_FAVORITE_ACTIONS: RemoteFavoriteActions = {
  add: () => Promise.resolve("blocked"),
  remove: () => Promise.resolve("blocked")
};
