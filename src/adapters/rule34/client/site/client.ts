import * as CurrentPage from "@/adapters/rule34/client/site/current_page/current_page";
import * as FavoritesPage from "@/adapters/rule34/client/site/favorites_page/fetcher";
import * as FavoritesPageCleanup from "@/adapters/rule34/client/site/favorites_page/cleanup";
import * as Header from "@/adapters/rule34/client/site/header/header";
import * as PostListPage from "@/adapters/rule34/client/site/post_list_page/fetcher";
import * as PostPage from "@/adapters/rule34/client/site/post_page/fetcher";
import * as PostPageParser from "@/adapters/rule34/client/site/post_page/parser";
import * as ProfilePage from "@/adapters/rule34/client/site/profile_page/fetcher";
import * as Theme from "@/adapters/rule34/client/site/theme/theme";
import { CategorizedPost, Post } from "@/core/domain/post/post";
import { ColorScheme } from "@/core/boundary/environment";
import { FavoriteActions } from "@/adapters/rule34/client/site/favorite_actions/favorite_actions";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { pageRateLimiter } from "@/adapters/rule34/client/site/page_rate_limiter";

export class Rule34SiteClient {
  private readonly favoriteActions = new FavoriteActions();
  private readonly favoritesFetches = new Set<Promise<void>>();

  constructor(private readonly rateLimiter: Pick<RateLimiter, "run"> = pageRateLimiter) { }

  public readPageName(): CurrentPage.PageName | null {
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
    return PostPage.postPageUrl(id);
  }

  public postListUrl(searchQuery: string): string {
    return PostListPage.postListUrlFromQuery(searchQuery);
  }

  public fetchFavoritesPage(pageId: string, pageIndex: number): Promise<Post[]> {
    return FavoritesPage.fetchFavoritesPage(pageId, pageIndex);
  }

  public fetchFavoriteCount(pageId: string): Promise<number | null> {
    return this.rateLimiter.run(() => ProfilePage.fetchFavoriteCount(pageId));
  }

  public async fetchPostPage(id: string): Promise<CategorizedPost> {
    return PostPageParser.parsePostFromPostPage(await this.fetchPostPageHtml(id));
  }

  public prioritizeFavorites<T>(fetchFavorites: () => Promise<T>): Promise<T> {
    const running = fetchFavorites();
    const settled = running.then(() => { }, () => { });

    this.favoritesFetches.add(settled);
    settled.then(() => this.favoritesFetches.delete(settled));
    return running;
  }

  public addFavorite(id: string): Promise<string | null> {
    return this.favoriteActions.add(id);
  }

  public removeFavorite(id: string): Promise<boolean> {
    return this.favoriteActions.remove(id);
  }

  private async fetchPostPageHtml(id: string): Promise<string> {
    await Promise.all(this.favoritesFetches);
    return this.rateLimiter.run(() => PostPage.fetchPostPage(id));
  }
}
