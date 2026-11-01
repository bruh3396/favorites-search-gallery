import { AppPreferences } from "@/core/app/app_preferences";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteSizeRecorder } from "@/core/app/favorites/search_panel/favorite_size_recorder";
import { FavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { Lightbox } from "@/core/features/lightbox/lightbox";
import { ListSequence } from "@/core/domain/media/list_sequence";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { Readable } from "@/core/utils/reactive/signal";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonGrid } from "@/core/ui/post_grid/skeleton_grid";
import { TabStripToggle } from "@/core/app/favorites/search_panel/tab_strip_toggle";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { h } from "@/core/ui/h/h";

export interface FavoritesSearchPanelDependencies {
  favoritesService: Pick<FavoritesService, "loadState" | "searchable" | "hydrated">;
  favoritesPreferences: Pick<AppPreferences["favorites"], "grid" | "pagination" | "tabStripVisible">;
  tabCount: Readable<number>;
  favoriteSizeRecorder: Pick<FavoriteSizeRecorder, "sizes">;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  remotePages: Pick<RemotePages, "postUrl">;
  lightbox: Pick<Lightbox<Favorite>, "open">;
  postActions: Pick<PostActions, "openOriginal">;
  enterZen: () => void;
}

export function composeFavoritesSearchPanel(favoritesTab: FavoritesTab, dependencies: FavoritesSearchPanelDependencies): HTMLElement {
  const {
    favoritesService, favoritesPreferences, tabCount, favoriteSizeRecorder, visibilityObserver, sizeObserver, imageLoaderService, remotePages, lightbox,
    postActions, enterZen
  } = dependencies;
  return h(FavoritesSearchPanel, {
    favoritesService,
    favoritesSession: favoritesTab.session,
    focusSearch: favoritesTab.focusSearch,
    trailingChild: [
      h(TabStripToggle, { visible: favoritesPreferences.tabStripVisible, tabCount }),
      h(IconButton, { icon: "scan", label: "Zen", onClick: enterZen })
    ],
    skeleton: h(SkeletonGrid, {
      sizes: favoriteSizeRecorder.sizes,
      layout: favoritesPreferences.grid.layout,
      columnCount: favoritesPreferences.grid.columnCount,
      count: favoritesPreferences.pagination.pageSize.peek()
    }),
    grid: h(PostGrid<Favorite>, {
      posts: favoritesTab.session.pageFavorites,
      changed: favoritesService.hydrated,
      tileLocator: favoritesTab.tileLocator,
      settings: favoritesPreferences.grid,
      getSize: favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }),
      createActions: () => [],
      visibilityObserver, sizeObserver, imageLoaderService,
      getPostUrl: favorite => remotePages.postUrl(favorite.id),
      onPlainClick: favorite => lightbox.open(
        new ListSequence({ wraps: !favoritesPreferences.pagination.infiniteScroll.peek() }, favoritesTab.session.matchedFavorites),
        favorite
      ),
      onCtrlClick: favorite => postActions.openOriginal(favorite)
    })
  });
}
