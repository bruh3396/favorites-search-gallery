import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";

export interface RemotePosts {
  fetch: (post: Readonly<Pick<Post, "id" | "deleted">>) => Promise<CategorizedPost>;
}
