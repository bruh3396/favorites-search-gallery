import { Post } from "@/core/domain/post/post";

export interface PostList {
  pageIndex: number;
  posts: Post[];
  isLast: boolean;
}
