import * as CurrentPage from "@/adapters/rule34/client/current_page/current_page";
import * as FavoritesPage from "@/adapters/rule34/client/favorites_page/favorites_page";
import * as FavoritesPageCleanup from "@/adapters/rule34/client/favorites_page/cleanup";
import * as PostListPage from "@/adapters/rule34/client/post_list_page/post_list_page";
import * as PostPage from "@/adapters/rule34/client/post_page/post_page";
import * as PostPageParser from "@/adapters/rule34/client/post_page/parser";
import * as ProfilePage from "@/adapters/rule34/client/profile_page/profile_page";
import { PageRequests, sitePageRequests } from "@/adapters/rule34/client/http";
import { FavoriteActions } from "@/adapters/rule34/client/favorite_actions/favorite_actions";
import { Post } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/types/search";

export class Rule34Client {
  private readonly favoriteActions = new FavoriteActions();
  private readonly favoritesFetches = new Set<Promise<void>>();

  constructor(private readonly pageRequests: PageRequests = sitePageRequests) { }

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

  public readTheme(): string {
    return CurrentPage.readTheme();
  }

  public readTagBlacklist(): string {
    return CurrentPage.readTagBlacklist();
  }

  public clearNativePage(): void {
    FavoritesPageCleanup.clearNativePage();
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

  public fetchFavoritesCount(pageId: string): Promise<number | null> {
    return ProfilePage.fetchFavoritesCount(pageId, this.pageRequests);
  }

  public async fetchPostPage(id: string): Promise<PostPageParser.PostPage> {
    return PostPageParser.parsePostFromPostPage(await this.fetchPostPageHtml(id));
  }

  public async fetchPostPageTagCategories(id: string): Promise<TagCategoryMap> {
    return PostPageParser.parseTagCategoriesFromPostPage(await this.fetchPostPageHtml(id));
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
    return PostPage.fetchPostPage(id, this.pageRequests);
  }
}
