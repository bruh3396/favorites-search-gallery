import { Post } from "@/core/domain/post/post";

export function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: "0",
    tags: "",
    width: 0,
    height: 0,
    score: 0,
    rating: "explicit",
    changedAt: 0,
    media: { kind: "image", locator: "" },
    ...overrides
  };
}

export function createPosts(...ids: string[]): Post[] {
  return ids.map(id => createPost({ id }));
}
