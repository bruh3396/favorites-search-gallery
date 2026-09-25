import { GalleryState, Layout } from "@/types/app";
import { Environment } from "@/app/context/environment";
import { Favorite } from "@/types/favorite";
import { FeatureChannel } from "@/lib/event/feature_channel";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export class FeatureBridge {
  public readonly favorites = {
    advance: new FeatureChannel<NavigationKey, boolean>(false),
    favoriteIds: new FeatureChannel<void, Promise<string[]>>(Promise.resolve([])),
    layout: new FeatureChannel<void, Layout>("column"),
    pixelCount: new FeatureChannel<string, number>(0),
    searchQuery: new FeatureChannel<void, string>(""),
    searchResults: new FeatureChannel<void, Favorite[]>([]),
    toolbar: new FeatureChannel<void, HTMLElement | null>(null),
    usingInfiniteScroll: new FeatureChannel<void, boolean>(false)
  };

  public readonly gallery = {
    currentThumb: new FeatureChannel<void, HTMLElement | null>(null),
    state: new FeatureChannel<void, GalleryState>("idle")
  };

  public readonly postList = {
    layout: new FeatureChannel<void, Layout>("column"),
    navigateToAdjacent: new FeatureChannel<NavigationKey, PostList | null>(null),
    searchQuery: new FeatureChannel<void, string>(""),
    thumbs: new FeatureChannel<void, HTMLElement[]>([]),
    usingInfiniteScroll: new FeatureChannel<void, boolean>(false)
  };

  constructor(private readonly environment: Environment) { }

  public galleryOpened(): boolean {
    return this.gallery.state.call() === "open";
  }

  public galleryIdle(): boolean {
    return this.gallery.state.call() === "idle";
  }

  public currentSearchQuery(): string {
    return this.environment.onPostListPage ? this.postList.searchQuery.call() : this.favorites.searchQuery.call();
  }

  public usingInfiniteScroll(): boolean {
    return this.environment.onPostListPage ? this.postList.usingInfiniteScroll.call() : this.favorites.usingInfiniteScroll.call();
  }

  public currentLayout(): Layout {
    return this.environment.onPostListPage ? this.postList.layout.call() : this.favorites.layout.call();
  }
}
