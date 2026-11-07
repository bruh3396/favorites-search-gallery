import { DEFAULT_TAG_SUGGESTER_CONFIGURATION, TagSuggester } from "@/core/features/autocomplete/tag_suggester";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { AppPreferences } from "@/core/app/app_preferences";
import { Autocomplete } from "@/core/features/autocomplete/autocomplete";
import { CountToggleButton } from "@/core/ui/components/count_toggle_button/count_toggle_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteSizeRecorder } from "@/core/app/favorites/search_panel/favorite_size_recorder";
import { FavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loading/image_loader_service";
import { Lightbox } from "@/core/features/lightbox/lightbox";
import { ListSequence } from "@/core/features/lightbox/navigation/list_sequence";
import { MetatagSuggester } from "@/core/features/autocomplete/metatag_suggester";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SearchHistory } from "@/core/utils/collection/search_history";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonGrid } from "@/core/ui/post_grid/skeleton_grid";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { SuggestionList } from "@/core/ui/components/suggestion_list/suggestion_list";
import { Tile } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { composeFavoritesSearchSettingsRow } from "@/core/app/favorites/search_settings/favorites_search_settings_row_composer";
import { h } from "@/core/ui/h/h";

export interface FavoritesSearchPanelConfiguration {
  readonly userOwnsFavorites: boolean;
}

export interface FavoritesSearchPanelDependencies {
  favoritesService: Pick<FavoritesService, "loadState" | "searchable" | "hydrated" | "getTagsStartingWith" | "countFavoritesWithTag">;
  favoritesPreferences: Pick<AppPreferences["favorites"], "grid" | "pagination">;
  favoritesTabStripVisible: StoredValue<boolean>;
  favoritesSearchSettingsVisible: StoredValue<boolean>;
  tabCount: Readable<number>;
  searchHistory: Pick<SearchHistory, "submittedQueries" | "record">;
  favoriteSizeRecorder: Pick<FavoriteSizeRecorder, "sizes">;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  remotePages: Pick<RemotePages, "postUrl" | "searchUrl">;
  navigator: Pick<Navigator, "open">;
  lightbox: Pick<Lightbox<Favorite>, "open">;
  postActions: Pick<PostActions, "openOriginal">;
  enterZen: () => void;
}

export function composeFavoritesSearchPanel(
  favoritesTab: FavoritesTab,
  configuration: FavoritesSearchPanelConfiguration,
  dependencies: FavoritesSearchPanelDependencies
): HTMLElement {
  const {
    favoritesService, favoritesPreferences, favoritesTabStripVisible, favoritesSearchSettingsVisible, tabCount, searchHistory, favoriteSizeRecorder,
    visibilityObserver, sizeObserver, imageLoaderService, remotePages, navigator, lightbox, postActions, enterZen
  } = dependencies;
  const autocomplete = new Autocomplete({
    suggesters: [
      new MetatagSuggester(),
      new TagSuggester(DEFAULT_TAG_SUGGESTER_CONFIGURATION, {
        getTagsStartingWith: favoritesService.getTagsStartingWith,
        countFavoritesWithTag: favoritesService.countFavoritesWithTag
      })
    ]
  });
  const activeDescendantElement = new Signal<HTMLElement | null>(null);
  const { changedSearchSettingCount } = favoritesTab.session;
  const hiddenTabCount = computed(() => (!favoritesTabStripVisible.value && tabCount.value > 1 ? tabCount.value : 0));
  return h(FavoritesSearchPanel, {
    favoritesService,
    favoritesSession: favoritesTab.session,
    submittedQueries: searchHistory.submittedQueries,
    submit: query => {
      favoritesTab.session.submit(query);
      searchHistory.record(query);
    },
    focusSearch: favoritesTab.focusSearch,
    fieldTrailingChild: h(CountToggleButton, {
      icon: "filter",
      label: computed(() => (changedSearchSettingCount.value > 0 ? `Filters, ${changedSearchSettingCount.value} changed` : "Filters")),
      pressed: favoritesSearchSettingsVisible,
      count: changedSearchSettingCount,
      onClick: () => favoritesSearchSettingsVisible.set(!favoritesSearchSettingsVisible.peek())
    }),
    subheaderChild: h(
      "div",
      { hidden: computed(() => !favoritesSearchSettingsVisible.value) },
      composeFavoritesSearchSettingsRow({ userOwnsFavorites: configuration.userOwnsFavorites }, { favoritesSession: favoritesTab.session })
    ),
    trailingChild: [
      h(CountToggleButton, {
        icon: "appWindow",
        label: computed(() => (hiddenTabCount.value > 0 ? `Tabs, ${hiddenTabCount.value} open` : "Tabs")),
        pressed: favoritesTabStripVisible,
        count: hiddenTabCount,
        onClick: () => favoritesTabStripVisible.set(!favoritesTabStripVisible.peek())
      }),
      h(IconButton, { icon: "scan", label: "Enter Zen", onClick: enterZen })
    ],
    fieldPopupChild: h("div", { hidden: computed(() => autocomplete.suggestions.value.length === 0) }, h(SuggestionList, {
      suggestions: autocomplete.suggestions,
      highlightedIndex: autocomplete.highlightedIndex,
      onAccept: autocomplete.accept,
      onActiveDescendantChange: currentActiveDescendantElement => {
        activeDescendantElement.value = currentActiveDescendantElement;
      }
    })),
    searchBoxAssist: autocomplete,
    activeDescendantElement,
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
      sizeObserver,
      createTile: (favorite, sizing) => h(Tile, {
        mediaItem: favorite,
        size: { width: favorite.getMetric("width"), height: favorite.getMetric("height") },
        sizing,
        actions: [],
        visibilityObserver, imageLoaderService,
        href: remotePages.postUrl(favorite.id),
        onPlainClick: () => lightbox.open(
          new ListSequence({ wraps: !favoritesPreferences.pagination.infiniteScroll.peek() }, favoritesTab.session.matchedFavorites),
          favorite
        ),
        onCtrlClick: () => postActions.openOriginal(favorite)
      })
    }),
    searchElsewhere: query => navigator.open(remotePages.searchUrl(query))
  });
}
