import { Post } from "@/types/api";

export function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: "0",
    tags: "",
    width: 0,
    height: 0,
    score: 0,
    rating: "e",
    change: 0,
    fileURL: "",
    previewURL: "",
    ...overrides
  };
}

export function createPosts(...ids: string[]): Post[] {
  return ids.map(id => createPost({ id }));
}
