import { Post } from "@/core/domain/post/post";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigatorPageCache } from "@/features/post_list_navigator/model/page_cache";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { numbersAround } from "@/core/utils/number/number";

const PREFETCH_LENGTH = 3;

export class PostListNavigatorPageLoader {
  private readonly cache: PostListNavigatorPageCache = new PostListNavigatorPageCache();

  constructor(private readonly searchResults: RemoteSearchResults) { }

  public load(pageNumber: number): Promise<void> {
    if (pageNumber < 0 || this.cache.isLoaded(pageNumber)) {
      return Promise.resolve();
    }
    const pending = this.cache.pendingLoad(pageNumber);

    if (pending !== undefined) {
      return pending;
    }
    const loaded = this.searchResults.fetchPage(pageNumber)
      .then((posts) => {
        this.cache.markLoaded(pageNumber, { pageIndex: pageNumber, posts, isLast: posts.length < this.searchResults.pageSize });
      }).catch(() => {
        this.cache.remove(pageNumber);
      });

    this.cache.markLoading(pageNumber, loaded);
    return loaded;
  }

  public preloadAround(currentPageNumber: number): void {
    numbersAround(currentPageNumber, PREFETCH_LENGTH).forEach(n => this.load(n));
  }

  public reload(pageNumber: number): Promise<void> {
    this.cache.remove(pageNumber);
    return this.load(pageNumber);
  }

  public get(pageNumber: number): PostList | undefined {
    return this.cache.get(pageNumber);
  }

  public allPosts(): Post[] {
    return this.cache.allPosts();
  }

  public getPost(id: string): Post | undefined {
    return this.cache.getPost(id);
  }
}
