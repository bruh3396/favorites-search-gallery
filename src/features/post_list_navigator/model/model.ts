import { AppContext } from "@/app/context/context";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { PostListNavigatorFavoriteIds } from "@/features/post_list_navigator/model/favorite_ids";
import { PostListNavigatorNavigator } from "@/features/post_list_navigator/model/navigator";

export class PostListNavigatorModel {
  private readonly navigator: PostListNavigatorNavigator;
  private readonly favoriteIds: PostListNavigatorFavoriteIds;

  constructor(context: AppContext) {
    this.navigator = new PostListNavigatorNavigator(context);
    this.favoriteIds = new PostListNavigatorFavoriteIds();
  }

  public preloadAroundInitialPage(): void {
    this.navigator.preloadAroundInitialPage();
  }

  public navigate(direction: NavigationKey): PostListNavigationResult {
    return this.navigator.navigate(direction);
  }

  public getMoreResults(): Promise<HTMLElement[]> {
    return this.navigator.getMoreResults();
  }

  public getInitialPostList(): PostList {
    return this.navigator.getInitialPostList();
  }

  public resetCurrentPageNumber(): void {
    this.navigator.resetCurrentPageNumber();
  }

  public allThumbs(): HTMLElement[] {
    return this.navigator.allThumbs();
  }

  public ensureFavoriteIdsLoaded(fetchIds: () => Promise<string[]>): Promise<void> {
    return this.favoriteIds.ensureLoaded(fetchIds);
  }

  public isFavorite(id: string): boolean {
    return this.favoriteIds.has(id);
  }

  public addFavoriteId(id: string): void {
    this.favoriteIds.add(id);
  }

  public removeFavoriteId(id: string): void {
    this.favoriteIds.remove(id);
  }

  public filterFavorites(thumbs: HTMLElement[]): HTMLElement[] {
    return thumbs.filter(thumb => this.favoriteIds.has(thumb.id));
  }
}
