import * as CurrentPage from "@/adapters/rule34/client/site/current_page/current_page";
import * as FavoritesPageCleanup from "@/adapters/rule34/client/site/favorites_page/cleanup";
import * as Header from "@/adapters/rule34/client/site/header/header";
import * as PostListPage from "@/adapters/rule34/client/site/post_list_page/fetcher";
import * as Theme from "@/adapters/rule34/client/site/theme/theme";
import { CategorizedPost, Post } from "@/core/domain/post/post";
import { Rule34AddFavoriteAnswer, Rule34FavoriteActions } from "@/adapters/rule34/client/site/favorite_actions/favorite_actions";
import { Rule34Fetch, request } from "@/adapters/rule34/client/request";
import { favoritesPageOffset, favoritesPageUrl } from "@/adapters/rule34/client/site/favorites_page/url";
import { ColorScheme } from "@/core/boundary/environment";
import { Random } from "@/core/boundary/ports/random";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { pageRateLimiter } from "@/adapters/rule34/client/site/page_rate_limiter";
import { parseFavoriteCount } from "@/adapters/rule34/client/site/profile_page/parser";
import { parseFavoritesPage } from "@/adapters/rule34/client/site/favorites_page/parser";
import { parsePostPage } from "@/adapters/rule34/client/site/post_page/parser";
import { postPageUrl } from "@/adapters/rule34/client/site/post_page/url";
import { profilePageUrl } from "@/adapters/rule34/client/site/profile_page/url";

export interface Rule34SiteClientDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  random: Random;
}

export class Rule34SiteClient {
  private readonly favoriteActions: Rule34FavoriteActions;
  private readonly favoritesFetches = new Set<Promise<void>>();

  constructor(
    private readonly dependencies: Rule34SiteClientDependencies,
    private readonly rateLimiter: Pick<RateLimiter, "run"> = pageRateLimiter
  ) {
    this.favoriteActions = new Rule34FavoriteActions(dependencies);
  }

  public readPageName(): CurrentPage.Rule34PageName | null {
    return CurrentPage.readPageName();
  }

  public readFavoritesPageId(): string {
    return CurrentPage.readFavoritesPageId();
  }

  public readFirstFavoritesPage(): Post[] | null {
    return CurrentPage.readFirstFavoritesPage();
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
    FavoritesPageCleanup.clearNativePage();
  }

  public setHeaderVisible(visible: boolean): void {
    Header.setHeaderVisible(visible);
  }

  public setTheme(colorScheme: ColorScheme): void {
    Theme.setTheme(colorScheme);
  }

  public postPageUrl(id: string): string {
    return postPageUrl(id);
  }

  public postListUrl(searchQuery: string): string {
    return PostListPage.postListUrlFromQuery(searchQuery);
  }

  public async fetchFavoritesPage(pageId: string, pageIndex: number): Promise<Post[]> {
    const html = await this.fetchHtml(favoritesPageUrl(pageId, favoritesPageOffset(pageIndex)));
    return parseFavoritesPage(new DOMParser().parseFromString(html, "text/html"));
  }

  public async fetchFavoriteCount(pageId: string): Promise<number> {
    return parseFavoriteCount(await this.rateLimiter.run(() => this.fetchHtml(profilePageUrl(pageId))));
  }

  public async fetchPostPage(id: string): Promise<CategorizedPost> {
    await Promise.all(this.favoritesFetches);
    return parsePostPage(await this.rateLimiter.run(() => this.fetchHtml(postPageUrl(id))));
  }

  public prioritizeFavorites<T>(fetchFavorites: () => Promise<T>): Promise<T> {
    const running = fetchFavorites();
    const settled = running.then(() => { }, () => { });

    this.favoritesFetches.add(settled);
    settled.then(() => this.favoritesFetches.delete(settled));
    return running;
  }

  public addFavorite(id: string): Promise<Rule34AddFavoriteAnswer | null> {
    return this.favoriteActions.add(id);
  }

  public removeFavorite(id: string): Promise<boolean> {
    return this.favoriteActions.remove(id);
  }

  private async fetchHtml(url: string): Promise<string> {
    return (await request(this.dependencies.fetch, url)).text();
  }
}
