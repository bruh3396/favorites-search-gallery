import { Post } from "@/core/domain/post/post";
import { sleep } from "@/lib/async/scheduling";

export class IncrementalPageFetcher {
  constructor(
    private readonly onPostsFound: (posts: Post[]) => void,
    private readonly fetch: (pageIndex: number) => Promise<Post[]>,
    private readonly pageSize: number,
    private readonly fetchDelay: number,
    private readonly seen: ReadonlySet<string>
  ) { }

  public async fetchMissing(firstPage?: Post[]): Promise<void> {
    let pageIndex = 0;
    let unseen = this.deliverUnseen(firstPage ?? await this.fetch(pageIndex));

    while (unseen.length >= this.pageSize) {
      pageIndex += 1;
      await sleep(this.fetchDelay);
      unseen = this.deliverUnseen(await this.fetch(pageIndex));
    }
  }

  private deliverUnseen(posts: Post[]): Post[] {
    const unseen = posts.filter(post => !this.seen.has(post.id));

    if (unseen.length > 0) {
      this.onPostsFound(unseen);
    }
    return unseen;
  }
}
