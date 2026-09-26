import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { Post } from "@/types/api";
import { sleep } from "@/lib/async/scheduling";

export class FavoritesIncrementalFetcher {
  constructor(
    private readonly fetch: (pageIndex: number) => Promise<Post[]>,
    private readonly fetchDelay: number,
    private readonly seen: Set<string>
  ) { }

  public async fetchNew(firstPageFavorites?: Post[]): Promise<Post[]> {
    const result: Post[] = [];
    let pageIndex = 0;

    while (true) {
      const posts = pageIndex === 0 && firstPageFavorites !== undefined ? firstPageFavorites : await this.fetch(pageIndex);
      const unseen = posts.filter(post => !this.seen.has(post.id));

      result.push(...unseen);

      if (unseen.length < FAVORITES_PER_PAGE) {
        break;
      }
      pageIndex += 1;
      await sleep(this.fetchDelay);
    }
    return result;
  }
}
