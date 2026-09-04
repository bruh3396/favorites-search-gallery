import { Post } from "@/types/api";

export type StoredPost = Omit<Post, "tagCategories">;

export function postToStoredPost(post: Post): StoredPost {
  const { tagCategories, ...stored } = post;
  return stored;
}

export function storedPostToPost(stored: StoredPost): Post {
  return { ...stored, tagCategories: new Map() };
}
