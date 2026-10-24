import { Post } from "@/core/domain/post/post";

export interface SearchResultsPage {
  readonly index: number;
  readonly posts: readonly Readonly<Post>[];
}

export interface RemoteSearchResults {
  readInitialPage: () => SearchResultsPage;
  fetchPage: (index: number) => Promise<SearchResultsPage>;
}
