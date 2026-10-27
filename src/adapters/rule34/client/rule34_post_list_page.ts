import { Post } from "@/core/domain/post/post";

export interface Rule34PostListPage {
  readonly posts: Post[];
  readonly paginator: HTMLElement | null;
}
