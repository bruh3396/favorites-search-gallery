import { ALL_POST_STATUSES_MASK, toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK, toRatingMask } from "@/core/domain/post/rating_mask";
import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/color_scheme";
import { FAVORITES_SETTING_RANGES, FavoritesSettingRange } from "@/core/app/favorites/settings/favorites_setting_ranges";
import { clamp, roundDownToMultiple, roundUpToMultiple } from "@/core/utils/number/number_utilities";
import { AppPreferences } from "@/core/app/app_preferences";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { FAVORITES_GRID_LAYOUTS } from "@/core/app/favorites/settings/favorites_grid_layouts";
import { FAVORITES_SETTINGS_TOOL } from "@/core/app/favorites/settings/favorites_settings_tool";
import { FAVORITES_SORT_KEYS } from "@/core/features/favorites/search/favorites_sort_key";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { LIGHTBOX_MODES } from "@/core/features/lightbox/lightbox_mode";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SharedPreferences } from "@/core/app/shared_preferences";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { THEMES } from "@/core/ui/theme/theme";

export interface FavoritesCommandHandlersConfiguration {
  readonly userOwnsFavorites: boolean;
}

export interface FavoritesCommandHandlersDependencies {
  favoritesWorkspace: Pick<FavoritesWorkspace, "activeTab" | "tabManager" | "openBlankTab" | "closeTab" | "closeAllTabs">;
  favoritesPreferences: Pick<AppPreferences["favorites"], "grid" | "pagination" | "lightbox" | "nativeHeaderVisible" | "activeTool">;
  sharedPreferences: Pick<SharedPreferences, "theme" | "colorScheme" | "postListEnabled">;
  favoritesTabStripVisible: StoredValue<boolean>;
  favoritesSearchSettingsVisible: StoredValue<boolean>;
  zenEnabled: Signal<boolean>;
  remotePages: Pick<RemotePages, "searchUrl">;
  navigator: Pick<Navigator, "open">;
  openLightbox: (favoritesSession: FavoritesSession, favorite: Favorite) => boolean;
  resetSettings: () => void;
}

const RATING_CYCLE: readonly number[] = [ALL_RATINGS_MASK, toRatingMask("explicit"), toRatingMask("questionable"), toRatingMask("safe")];
const STATUS_CYCLE: readonly number[] = [ALL_POST_STATUSES_MASK, toPostStatusMask("active") | toPostStatusMask("deleted"), toPostStatusMask("purged")];

export function createFavoritesCommandHandlers(
  configuration: FavoritesCommandHandlersConfiguration,
  dependencies: FavoritesCommandHandlersDependencies
): CommandHandlers<FavoritesCommand> {
  const {
    favoritesWorkspace, favoritesPreferences, sharedPreferences, favoritesTabStripVisible, favoritesSearchSettingsVisible, zenEnabled,
    remotePages, navigator, openLightbox, resetSettings
  } = dependencies;
  const { tabManager } = favoritesWorkspace;
  const { grid: favoritesGridPreferences, pagination: favoritesPaginationPreferences } = favoritesPreferences;
  const activeFavoritesSession = (): FavoritesSession => favoritesWorkspace.activeTab.peek().session;
  const favoritesSearchSettings = (): FavoritesSearchSettings => activeFavoritesSession().searchSettings.peek();
  const activeTabIndex = (): number => tabManager.tabs.peek().findIndex(tab => tab.id === tabManager.activeTabId.peek());
  const activateTabAt = (offset: number): void => {
    const tabs = tabManager.tabs.peek();

    tabManager.activate(tabs[(activeTabIndex() + offset + tabs.length) % tabs.length].id);
  };
  const moveActiveTab = (offset: number): void => {
    const activeTabId = tabManager.activeTabId.peek();

    if (activeTabId !== null) {
      tabManager.move(activeTabId, clamp(activeTabIndex() + offset, 0, tabManager.tabs.peek().length - 1));
    }
  };
  const goToPage = (pageNumber: number): void => activeFavoritesSession().goTo(pageNumber);
  return {
    focusSearch: () => favoritesWorkspace.activeTab.peek().focusSearch.emit(),
    clearSearch: () => activeFavoritesSession().clearSearch(),
    toggleFilters: () => toggle(favoritesSearchSettingsVisible),
    cycleSort: () => activeFavoritesSession().updateSearchSettings({ sortKey: findNext(FAVORITES_SORT_KEYS, favoritesSearchSettings().sortKey) }),
    toggleSortAscending: () => activeFavoritesSession().updateSearchSettings({ isSortAscending: !favoritesSearchSettings().isSortAscending }),
    shuffle: () => activeFavoritesSession().shuffle(),
    cycleRating: () => activeFavoritesSession().updateSearchSettings({ allowedRatings: findNext(RATING_CYCLE, favoritesSearchSettings().allowedRatings) }),
    toggleBlacklist: (): void => {
      if (configuration.userOwnsFavorites) {
        activeFavoritesSession().toggleBlacklist();
      }
    },
    toggleInvert: () => activeFavoritesSession().invert(),
    cycleStatus: () => activeFavoritesSession().updateSearchSettings({ allowedStatuses: findNext(STATUS_CYCLE, favoritesSearchSettings().allowedStatuses) }),
    resetFilters: () => activeFavoritesSession().resetSearchSettings(),
    searchElsewhere: () => navigator.open(remotePages.searchUrl(activeFavoritesSession().query.peek())),
    goToNextPage: () => goToPage(activeFavoritesSession().pageNumber.peek() + 1),
    goToPreviousPage: () => goToPage(activeFavoritesSession().pageNumber.peek() - 1),
    goToFirstPage: () => goToPage(1),
    goToLastPage: () => goToPage(activeFavoritesSession().pageCount.peek()),
    openNewTab: () => favoritesWorkspace.openBlankTab(),
    closeTab: (): void => {
      const activeTabId = tabManager.activeTabId.peek();

      if (activeTabId !== null) {
        favoritesWorkspace.closeTab(activeTabId);
      }
    },
    goToNextTab: () => activateTabAt(1),
    goToPreviousTab: () => activateTabAt(-1),
    toggleTabs: () => toggle(favoritesTabStripVisible),
    moveTabLeft: () => moveActiveTab(-1),
    moveTabRight: () => moveActiveTab(1),
    closeAllTabs: () => favoritesWorkspace.closeAllTabs(),
    toggleInfiniteScroll: () => toggle(favoritesPaginationPreferences.infiniteScroll),
    increasePageSize: () => stepUp(favoritesPaginationPreferences.pageSize, FAVORITES_SETTING_RANGES.pageSize),
    decreasePageSize: () => stepDown(favoritesPaginationPreferences.pageSize, FAVORITES_SETTING_RANGES.pageSize),
    increaseTileSize: () => stepDown(favoritesGridPreferences.columnCount, FAVORITES_SETTING_RANGES.columnCount),
    decreaseTileSize: () => stepUp(favoritesGridPreferences.columnCount, FAVORITES_SETTING_RANGES.columnCount),
    cycleLayout: () => favoritesGridPreferences.layout.set(findNext(FAVORITES_GRID_LAYOUTS, favoritesGridPreferences.layout.peek())),
    toggleHd: () => toggle(favoritesGridPreferences.hdTilesEnabled),
    toggleZen: (): void => {
      zenEnabled.value = !zenEnabled.peek();
    },
    exitZen: (): void => {
      zenEnabled.value = false;
    },
    toggleSettings: (): void => {
      const { id } = FAVORITES_SETTINGS_TOOL;

      favoritesPreferences.activeTool.set(favoritesPreferences.activeTool.peek() === id ? null : id);
    },
    cycleTheme: () => sharedPreferences.theme.set(findNext(THEMES, sharedPreferences.theme.peek())),
    toggleColorScheme: () => sharedPreferences.colorScheme.set(findNext<ColorScheme>(COLOR_SCHEMES, sharedPreferences.colorScheme.peek())),
    toggleHeader: () => toggle(favoritesPreferences.nativeHeaderVisible),
    toggleEnhanceSearchPages: () => toggle(sharedPreferences.postListEnabled),
    resetSettings,
    openGallery: (): void => {
      const favoritesSession = activeFavoritesSession();
      const favorite = favoritesSession.pageFavorites.peek().at(0);

      if (favorite !== undefined) {
        openLightbox(favoritesSession, favorite);
      }
    },
    cycleGalleryMode: () => favoritesPreferences.lightbox.mode.set(findNext(LIGHTBOX_MODES, favoritesPreferences.lightbox.mode.peek()))
  };
}

function toggle(storedValue: StoredValue<boolean>): void {
  storedValue.set(!storedValue.peek());
}

function findNext<T>(cycle: readonly T[], current: T): T {
  return cycle[(cycle.indexOf(current) + 1) % cycle.length];
}

function stepUp(storedValue: StoredValue<number>, { min, max, step }: FavoritesSettingRange): void {
  storedValue.set(clamp(roundUpToMultiple(storedValue.peek(), step), min, max));
}

function stepDown(storedValue: StoredValue<number>, { min, max, step }: FavoritesSettingRange): void {
  storedValue.set(clamp(roundDownToMultiple(storedValue.peek(), step), min, max));
}
