import { PostListPage } from "@/core/domain/post_list/post_list_page";

export interface RemotePostList {
  readInitialPage: () => PostListPage;
  fetchPage: (index: number) => Promise<PostListPage>;
}
