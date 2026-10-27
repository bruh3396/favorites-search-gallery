import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";
import { Rule34Fetch, sendOkRule34Request } from "@/adapters/rule34/client/rule34_fetch";
import {
  buildRule34FavoritesPageUrl,
  buildRule34PostListPageUrl,
  buildRule34PostListUrl,
  buildRule34PostPageUrl,
  buildRule34ProfilePageUrl,
  rule34FavoritesPageOffset
} from "@/adapters/rule34/client/rule34_url_builder";
import { Rule34PostListPage } from "@/adapters/rule34/client/rule34_post_list_page";
import { parseRule34FavoritesPage } from "@/adapters/rule34/client/rule34_favorites_page_parser";
import { parseRule34PostListPage } from "@/adapters/rule34/client/rule34_post_list_page_parser";
import { parseRule34PostPage } from "@/adapters/rule34/client/rule34_post_page_parser";
import { parseRule34ProfileFavoriteCount } from "@/adapters/rule34/client/rule34_profile_page_parser";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34ClientDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
  mintMedia: MediaMinter;
  rule34Document: Pick<Rule34Document, "isFirstFavoritesPage" | "keepPaginator">;
}

const PAGE_RATE_LIMIT = { concurrency: 1, ratePerSecond: 0.33 };

export class Rule34Client {
  private readonly favoritesFetches = new Set<Promise<void>>();
  private readonly rateLimiter: RateLimiter;

  constructor(private readonly dependencies: Rule34ClientDependencies) {
    this.rateLimiter = new RateLimiter(PAGE_RATE_LIMIT, dependencies.scheduler);
  }

  public readFirstFavoritesPage(): Post[] | null {
    if (!this.dependencies.rule34Document.isFirstFavoritesPage()) {
      return null;
    }
    const favorites = parseRule34FavoritesPage(document, this.dependencies.mintMedia);
    return favorites.length > 0 ? favorites : null;
  }

  public readPostListPage(pageIndex: number): Post[] {
    return this.keepPaginator(pageIndex, parseRule34PostListPage(document, this.dependencies.mintMedia));
  }

  public postPageUrl(id: string): string {
    return buildRule34PostPageUrl(id);
  }

  public postListUrl(searchQuery: string): string {
    return buildRule34PostListUrl(searchQuery);
  }

  public async fetchFavoritesPage(pageId: string, pageIndex: number): Promise<Post[]> {
    const html = await this.fetchHtml(buildRule34FavoritesPageUrl(pageId, rule34FavoritesPageOffset(pageIndex)));
    return parseRule34FavoritesPage(new DOMParser().parseFromString(html, "text/html"), this.dependencies.mintMedia);
  }

  public async fetchFavoriteCount(pageId: string): Promise<number> {
    const html = await this.rateLimiter.run(() => this.fetchHtml(buildRule34ProfilePageUrl(pageId)));
    return parseRule34ProfileFavoriteCount(html);
  }

  public async fetchPostListPage(searchQuery: string, pageIndex: number): Promise<Post[]> {
    const html = await this.rateLimiter.run(() => this.fetchHtml(buildRule34PostListPageUrl(searchQuery, pageIndex)));
    const page = new DOMParser().parseFromString(html, "text/html");
    return this.keepPaginator(pageIndex, parseRule34PostListPage(page, this.dependencies.mintMedia));
  }

  public async fetchPostPage(id: string): Promise<CategorizedPost> {
    await Promise.all(this.favoritesFetches);
    const html = await this.rateLimiter.run(() => this.fetchHtml(buildRule34PostPageUrl(id)));
    return parseRule34PostPage(html, this.dependencies.mintMedia);
  }

  public prioritizeFavorites<T>(fetchFavorites: () => Promise<T>): Promise<T> {
    const running = fetchFavorites();
    const settled = running.then(() => { }, () => { });

    this.favoritesFetches.add(settled);
    settled.then(() => this.favoritesFetches.delete(settled));
    return running;
  }

  private keepPaginator(pageIndex: number, page: Rule34PostListPage): Post[] {
    this.dependencies.rule34Document.keepPaginator(pageIndex, page.paginator);
    return page.posts;
  }

  private async fetchHtml(url: string): Promise<string> {
    return (await sendOkRule34Request(this.dependencies.fetch, url)).text();
  }
}
