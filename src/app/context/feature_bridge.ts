import { GalleryState, Layout } from "@/types/app";
import { Environment } from "@/core/boundary/environment";
import { Favorite } from "@/types/favorite";
import { FeatureChannel } from "@/lib/event/feature_channel";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export class FeatureBridge {
  public readonly favorites = {
    advance: new FeatureChannel<NavigationKey, boolean>(false),
    favorite: new FeatureChannel<string, Favorite | undefined>(undefined),
    favoriteIds: new FeatureChannel<void, Promise<string[]>>(Promise.resolve([])),
    layout: new FeatureChannel<void, Layout>("column"),
    searchQuery: new FeatureChannel<void, string>(""),
    searchResults: new FeatureChannel<void, Favorite[]>([]),
    toolbar: new FeatureChannel<void, HTMLElement | null>(null),
    usingInfiniteScroll: new FeatureChannel<void, boolean>(false)
  };

  public readonly gallery = {
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
    return this.gallery.state.request() === "open";
  }

  public galleryIdle(): boolean {
    return this.gallery.state.request() === "idle";
  }

  public currentSearchQuery(): string {
    return this.environment.mode === "posts" ? this.postList.searchQuery.request() : this.favorites.searchQuery.request();
  }

  public usingInfiniteScroll(): boolean {
    return this.environment.mode === "posts" ? this.postList.usingInfiniteScroll.request() : this.favorites.usingInfiniteScroll.request();
  }

  public currentLayout(): Layout {
    return this.environment.mode === "posts" ? this.postList.layout.request() : this.favorites.layout.request();
  }
}
