import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";

export interface RemotePosts {
  fetch: (post: Readonly<Pick<Post, "id" | "status">>) => Promise<CategorizedPost>;
}
