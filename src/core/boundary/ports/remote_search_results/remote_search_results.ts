import { Post } from "@/core/domain/post/post";

export interface RemoteSearchResults {
  readonly pageSize: number;
  readonly initialPageIndex: number;
  fetchPage: (pageIndex: number) => Promise<Post[]>;
}
