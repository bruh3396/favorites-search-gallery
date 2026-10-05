import { CategorizedPost, Post } from "@/core/domain/post/post";
import { Rule34Fetch, request } from "@/adapters/rule34/client/request";
import { Rule34PostListPage, parsePostListPage, postListPageUrl, postListUrlFromQuery } from "@/adapters/rule34/client/post_list_page";
import { favoritesPageOffset, favoritesPageUrl, parseFavoritesPage } from "@/adapters/rule34/client/favorites_page";
import { parseFavoriteCount, profilePageUrl } from "@/adapters/rule34/client/profile_page";
import { parsePostPage, postPageUrl } from "@/adapters/rule34/client/post_page";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { pageRateLimiter } from "@/adapters/rule34/client/page_rate_limiter";

export interface Rule34ClientDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
  mintMedia: Rule34MintMedia;
  rule34Document: Pick<Rule34Document, "isFirstFavoritesPage" | "keepPaginator">;
}

export class Rule34Client {
  private readonly favoritesFetches = new Set<Promise<void>>();

  constructor(
    private readonly dependencies: Rule34ClientDependencies,
    private readonly rateLimiter: Pick<RateLimiter, "run"> = pageRateLimiter
  ) { }

  public readFirstFavoritesPage(): Post[] | null {
    if (!this.dependencies.rule34Document.isFirstFavoritesPage()) {
      return null;
    }
    return parseFavoritesPage(document, this.dependencies.mintMedia);
  }

  public readPostListPage(pageIndex: number): Post[] {
    return this.keepPaginator(pageIndex, parsePostListPage(document, this.dependencies.mintMedia));
  }

  public postPageUrl(id: string): string {
    return postPageUrl(id);
  }

  public postListUrl(searchQuery: string): string {
    return postListUrlFromQuery(searchQuery);
  }

  public async fetchFavoritesPage(pageId: string, pageIndex: number): Promise<Post[]> {
    const html = await this.fetchHtml(favoritesPageUrl(pageId, favoritesPageOffset(pageIndex)));
    return parseFavoritesPage(new DOMParser().parseFromString(html, "text/html"), this.dependencies.mintMedia);
  }

  public async fetchFavoriteCount(pageId: string): Promise<number> {
    const html = await this.rateLimiter.run(() => this.fetchHtml(profilePageUrl(pageId)));
    return parseFavoriteCount(html);
  }

  public async fetchPostListPage(searchQuery: string, pageIndex: number): Promise<Post[]> {
    const html = await this.rateLimiter.run(() => this.fetchHtml(postListPageUrl(searchQuery, pageIndex)));
    const page = new DOMParser().parseFromString(html, "text/html");
    return this.keepPaginator(pageIndex, parsePostListPage(page, this.dependencies.mintMedia));
  }

  public async fetchPostPage(id: string): Promise<CategorizedPost> {
    await Promise.all(this.favoritesFetches);
    const html = await this.rateLimiter.run(() => this.fetchHtml(postPageUrl(id)));
    return parsePostPage(html, this.dependencies.mintMedia);
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
    return (await request(this.dependencies.fetch, url)).text();
  }
}
