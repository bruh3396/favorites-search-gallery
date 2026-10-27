import { Post } from "@/core/domain/post/post";

export interface PostListPage {
  readonly index: number;
  readonly posts: readonly Readonly<Post>[];
}
