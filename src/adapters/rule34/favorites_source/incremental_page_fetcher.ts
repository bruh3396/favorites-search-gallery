import { Post } from "@/core/domain/post/post";
import { sleep } from "@/lib/async/scheduling";

export class IncrementalPageFetcher {
  constructor(
    private readonly fetch: (pageIndex: number) => Promise<Post[]>,
    private readonly pageSize: number,
    private readonly fetchDelay: number,
    private readonly seen: Set<string>
  ) { }

  public async fetchNew(firstPage?: Post[]): Promise<Post[]> {
    let pageIndex = 0;
    let unseen = this.unseenOf(firstPage ?? await this.fetch(pageIndex));
    const result = [...unseen];

    while (unseen.length >= this.pageSize) {
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
