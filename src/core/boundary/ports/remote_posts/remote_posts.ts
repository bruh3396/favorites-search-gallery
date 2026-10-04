import { CategorizedPost, Post } from "@/core/domain/post/post";

export interface RemotePosts {
  fetch: (post: Pick<Post, "id" | "deleted">) => Promise<CategorizedPost>;
}

export class PostUnavailableError extends Error {
  constructor(public readonly id: string) {
    super(`Post ${id} is unavailable from this source`);
    this.name = "PostUnavailableError";
  }
}
