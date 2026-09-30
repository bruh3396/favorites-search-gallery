import { CategorizedPost, Post } from "@/core/domain/post/post";

export interface RemotePosts {
  fetch: (post: Pick<Post, "id" | "deleted">) => Promise<CategorizedPost>;
}
