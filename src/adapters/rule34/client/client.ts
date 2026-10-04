import * as CurrentPage from "@/adapters/rule34/client/current_page";
import * as FavoritesPage from "@/adapters/rule34/client/favorites_page";
import * as PostListPage from "@/adapters/rule34/client/post_list_page";
import * as PostPage from "@/adapters/rule34/client/post_page";
import * as ProfilePage from "@/adapters/rule34/client/profile_page";
import { CategorizedPost, Post } from "@/core/domain/post/post";
import { Rule34Fetch, request } from "@/adapters/rule34/client/request";
import { ColorScheme } from "@/core/boundary/environment";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { pageRateLimiter } from "@/adapters/rule34/client/page_rate_limiter";

export interface Rule34ClientDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
  mintMedia: Rule34MintMedia;
}

export class Rule34Client {
  private readonly favoritesFetches = new Set<Promise<void>>();
  private readonly postListPaginators = new Map<number, HTMLElement>();

  constructor(
    private readonly dependencies: Rule34ClientDependencies,
    private readonly rateLimiter: Pick<RateLimiter, "run"> = pageRateLimiter
  ) { }

  public readPageName(): CurrentPage.Rule34PageName | null {
    return CurrentPage.readPageName();
  }

  public readFavoritesPageId(): string {
    return CurrentPage.readFavoritesPageId();
  }

  public readFirstFavoritesPage(): Post[] | null {
    return CurrentPage.readFirstFavoritesPage(this.dependencies.mintMedia);
  }

  public readSearchQuery(): string {
    return CurrentPage.readSearchQuery();
  }

  public readPostListPageIndex(): number {
    return PostListPage.postListPageIndex(CurrentPage.readPageOffset());
  }

  public readPostListPage(pageIndex: number): Post[] {
    return this.keepPaginator(pageIndex, PostListPage.parsePostListPage(document, this.dependencies.mintMedia));
  }

  public readUserId(): string {
    return CurrentPage.readUserId();
  }

  public readTheme(): ColorScheme {
    return CurrentPage.readTheme();
  }

  public readTagBlacklist(): string {
    return CurrentPage.readTagBlacklist();
  }

  public clearNativePage(): void {
    CurrentPage.clearNativePage();
  }

  public setHeaderVisible(visible: boolean): void {
    CurrentPage.setHeaderVisible(visible);
  }

  public setTheme(colorScheme: ColorScheme): void {
    CurrentPage.setTheme(colorScheme);
  }

  public reflectPostListPage(pageIndex: number): void {
    const paginator = this.postListPaginators.get(pageIndex);

    if (paginator !== undefined) {
      CurrentPage.replacePaginator(paginator);
    }
    CurrentPage.setPageOffset(PostListPage.postListPageOffset(pageIndex));
  }

  public setPaginatorVisible(visible: boolean): void {
    CurrentPage.setPaginatorVisible(visible);
  }

  public postPageUrl(id: string): string {
    return PostPage.postPageUrl(id);
  }

  public postListUrl(searchQuery: string): string {
    return PostListPage.postListUrlFromQuery(searchQuery);
  }

  public async fetchFavoritesPage(pageId: string, pageIndex: number): Promise<Post[]> {
    const html = await this.fetchHtml(FavoritesPage.favoritesPageUrl(pageId, FavoritesPage.favoritesPageOffset(pageIndex)));
    return FavoritesPage.parseFavoritesPage(new DOMParser().parseFromString(html, "text/html"), this.dependencies.mintMedia);
  }

  public async fetchFavoriteCount(pageId: string): Promise<number> {
    const html = await this.rateLimiter.run(() => this.fetchHtml(ProfilePage.profilePageUrl(pageId)));
    return ProfilePage.parseFavoriteCount(html);
  }

  public async fetchPostListPage(searchQuery: string, pageIndex: number): Promise<Post[]> {
    const html = await this.rateLimiter.run(() => this.fetchHtml(PostListPage.postListPageUrl(searchQuery, pageIndex)));
    const page = new DOMParser().parseFromString(html, "text/html");
    return this.keepPaginator(pageIndex, PostListPage.parsePostListPage(page, this.dependencies.mintMedia));
  }

  public async fetchPostPage(id: string): Promise<CategorizedPost> {
    await Promise.all(this.favoritesFetches);
    const html = await this.rateLimiter.run(() => this.fetchHtml(PostPage.postPageUrl(id)));
    return PostPage.parsePostPage(html, this.dependencies.mintMedia);
  }

  public prioritizeFavorites<T>(fetchFavorites: () => Promise<T>): Promise<T> {
    const running = fetchFavorites();
    const settled = running.then(() => { }, () => { });

    this.favoritesFetches.add(settled);
    settled.then(() => this.favoritesFetches.delete(settled));
    return running;
  }

  private keepPaginator(pageIndex: number, page: PostListPage.Rule34PostListPage): Post[] {
    if (page.paginator !== null) {
      this.postListPaginators.set(pageIndex, page.paginator);
    }
    return page.posts;
  }

  private async fetchHtml(url: string): Promise<string> {
    return (await request(this.dependencies.fetch, url)).text();
  }
}
