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
    let pageIndex = 0;
    let unseen = this.unseenOf(firstPageFavorites ?? await this.fetch(pageIndex));
    const result = [...unseen];

    while (unseen.length >= FAVORITES_PER_PAGE) {
      pageIndex += 1;
      await sleep(this.fetchDelay);
      unseen = this.unseenOf(await this.fetch(pageIndex));
      result.push(...unseen);
    }
    return result;
  }

  private unseenOf(posts: Post[]): Post[] {
    return posts.filter(post => !this.seen.has(post.id));
  }
}
