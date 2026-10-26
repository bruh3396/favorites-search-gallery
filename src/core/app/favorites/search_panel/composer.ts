import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesPreferences } from "@/core/app/preferences";
import { FavoritesSearchPanel } from "@/core/app/favorites/search_panel/search_panel";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { Lightbox } from "@/core/features/lightbox/lightbox";
import { ListSequence } from "@/core/domain/media/list_sequence";
import { PostActions } from "@/core/app/post_actions";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { Readable } from "@/core/utils/reactive/signal";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonDimensions } from "@/core/app/favorites/storage/skeleton_dimensions";
import { SkeletonGrid } from "@/core/ui/post_grid/skeleton_grid";
import { TabStripToggle } from "@/core/app/favorites/search_panel/tab_strip_toggle";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { h } from "@/core/ui/h/h";

export interface SearchPanelDependencies {
  favorites: Pick<FavoritesService, "loadState" | "searchable" | "hydrated">;
  preferences: Pick<FavoritesPreferences, "layout" | "columnCount" | "pageSize" | "infiniteScroll" | "tabStripVisible">;
  tabCount: Readable<number>;
  skeletonDimensions: Pick<SkeletonDimensions, "value">;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  remotePages: Pick<RemotePages, "postUrl">;
  lightbox: Pick<Lightbox<Favorite>, "open">;
  postActions: Pick<PostActions, "openOriginal">;
  enterZen: () => void;
}

export function composeSearchPanel(tab: FavoritesTab, dependencies: SearchPanelDependencies): HTMLElement {
  const {
    favorites, preferences, tabCount, skeletonDimensions, visibilityObserver, sizeObserver, imageLoaderService, remotePages, lightbox, postActions, enterZen
  } = dependencies;
  return h(FavoritesSearchPanel, {
    favorites,
    session: tab.session,
    focusSearch: tab.focusSearch,
    trailing: [
      h(TabStripToggle, { visible: preferences.tabStripVisible, tabCount }),
      h(IconButton, { icon: "scan", label: "Zen", onClick: enterZen })
    ],
    skeleton: h(SkeletonGrid, {
      dimensions: skeletonDimensions.value,
      layout: preferences.layout,
      columnCount: preferences.columnCount,
      count: preferences.pageSize.peek()
    }),
    grid: h(PostGrid<Favorite>, {
      posts: tab.session.pageItems,
      changed: favorites.hydrated,
      tileLocator: tab.tileLocator,
      settings: preferences,
      getDimensions: post => ({ width: post.getMetric("width"), height: post.getMetric("height") }),
      createActions: () => [],
      visibilityObserver, sizeObserver, imageLoaderService,
      getPostUrl: post => remotePages.postUrl(post.id),
      onPlainClick: post => lightbox.open(new ListSequence({ wraps: !preferences.infiniteScroll.peek() }, tab.session.results), post),
      onCtrlClick: post => postActions.openOriginal(post)
    })
  });
}
