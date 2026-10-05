import { AppContext } from "@/app/context/context";
import { NavigationKey } from "@/types/input";
import { Post } from "@/core/domain/post/post";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { PostListNavigatorFavoriteIds } from "@/features/post_list_navigator/model/favorite_ids";
import { PostListNavigatorNavigator } from "@/features/post_list_navigator/model/navigator";

export class PostListNavigatorModel {
  private readonly navigator: PostListNavigatorNavigator;
  private readonly favoriteIds: PostListNavigatorFavoriteIds;

  constructor(context: AppContext) {
    this.navigator = new PostListNavigatorNavigator(context.ports.remoteSearchResults);
    this.favoriteIds = new PostListNavigatorFavoriteIds();
  }

  public loadInitialPage(): Promise<PostList> {
    return this.navigator.loadInitialPage();
  }

  public preloadAroundInitialPage(): void {
    this.navigator.preloadAroundInitialPage();
  }

  public navigate(direction: NavigationKey): PostListNavigationResult {
    return this.navigator.navigate(direction);
  }

  public getMoreResults(): Promise<Post[]> {
    return this.navigator.getMoreResults();
  }

  public getInitialPostList(): PostList {
    return this.navigator.getInitialPostList();
  }

  public resetCurrentPageNumber(): void {
    this.navigator.resetCurrentPageNumber();
  }

  public allPosts(): Post[] {
    return this.navigator.allPosts();
  }

  public getPost(id: string): Post | undefined {
    return this.navigator.getPost(id);
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

  public filterFavoriteIds(posts: Post[]): string[] {
    return posts.map(post => post.id).filter(id => this.favoriteIds.has(id));
  }
}
