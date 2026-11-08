import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC, FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { Mock, describe, expect, test, vi } from "vitest";
import { SharedPreferences, createSharedPreferences } from "@/core/app/shared_preferences";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { AppPreferences } from "@/core/app/app_preferences";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/memory_navigator";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { Signal } from "@/core/utils/reactive/signal";
import { StringInterner } from "@/core/utils/string/string_interner";
import { createFavoritesCommandHandlers } from "@/core/app/favorites/commands/favorites_command_handlers";
import { createPost } from "@/testing/post";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { toRatingMask } from "@/core/domain/post/rating_mask";

interface Setup {
  handlers: CommandHandlers<FavoritesCommand>;
  favoritesWorkspace: FavoritesWorkspace;
  favoritesPreferences: AppPreferences["favorites"];
  sharedPreferences: SharedPreferences;
  zenEnabled: Signal<boolean>;
  navigator: MemoryNavigator;
  openLightbox: Mock<(favoritesSession: FavoritesSession, favorite: Favorite) => boolean>;
  activeSession: () => FavoritesSession;
  activeTabIndex: () => number;
}

function setup({ postCount = 0, userOwnsFavorites = true } = {}): Setup {
  const localKeyedValues = new MemoryLocalKeyedValues();
  const favoritesPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, localKeyedValues, ["favorites"]).favorites;
  const sharedPreferences = createSharedPreferences(localKeyedValues, "light", { setColorScheme: vi.fn() });
  const { favoritesTabStripVisible, favoritesSearchSettingsVisible } = createStoredTree(
    APP_STORAGE_SCHEMA.state,
    localKeyedValues,
    ["favoritesTabStripVisible", "favoritesSearchSettingsVisible"]
  );
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const posts = Array.from({ length: postCount }, (_, index) => createPost({ id: String(index + 1) }));

  favoritesPreferences.pagination.pageSize.set(2);
  favoritesSearchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  const favoritesWorkspace = new FavoritesWorkspace({
    favoritesWorkspaceSnapshot: new KeyedStoredValue(
      { key: "workspace", defaultValue: DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT },
      { storedValueStorage: localKeyedValues, codec: FAVORITES_WORKSPACE_SNAPSHOT_CODEC }
    ),
    createSession: (favoritesSearchSettings): FavoritesSession => new FavoritesSession({ favoritesSearchSettings }, {
      favoritesSearchIndex,
      favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
      favoritesPaginationPreferences: favoritesPreferences.pagination,
      randomSource: new MemoryRandomSource()
    })
  });
  const zenEnabled = new Signal(false);
  const navigator = new MemoryNavigator();
  const openLightbox = vi.fn<(favoritesSession: FavoritesSession, favorite: Favorite) => boolean>(() => true);
  const handlers = createFavoritesCommandHandlers({ userOwnsFavorites }, {
    favoritesWorkspace, favoritesPreferences, sharedPreferences, favoritesTabStripVisible, favoritesSearchSettingsVisible, zenEnabled,
    remotePages: new MemoryRemotePages(new MemoryClient([])),
    navigator,
    openLightbox,
    resetSettings: vi.fn()
  });
  const activeSession = (): FavoritesSession => favoritesWorkspace.activeTab.peek().session;
  const activeTabIndex = (): number => favoritesWorkspace.tabManager.tabs.peek().findIndex(tab => tab.id === favoritesWorkspace.tabManager.activeTabId.peek());
  return { handlers, favoritesWorkspace, favoritesPreferences, sharedPreferences, zenEnabled, navigator, openLightbox, activeSession, activeTabIndex };
}

describe("createFavoritesCommandHandlers", () => {
  test("toggles Zen, and exits it staying out", () => {
    const { handlers, zenEnabled } = setup();

    handlers.toggleZen();
    const wasEntered = zenEnabled.value;

    handlers.exitZen();
    handlers.exitZen();
    expect([wasEntered, zenEnabled.value]).toEqual([true, false]);
  });

  test("cycles the sort, wrapping around, and flips its direction", () => {
    const { handlers, activeSession } = setup();
    const sortKeys = Array.from({ length: 8 }, () => {
      handlers.cycleSort();
      return activeSession().searchSettings.peek().sortKey;
    });

    handlers.toggleSortAscending();
    expect(sortKeys.at(-1)).toBe("favorited");
    expect(new Set(sortKeys).size).toBe(8);
    expect(activeSession().searchSettings.peek().isSortAscending).toBe(true);
  });

  test("cycles ratings through all, then each one alone", () => {
    const { handlers, activeSession } = setup();
    const ratings = Array.from({ length: 4 }, () => {
      handlers.cycleRating();
      return activeSession().searchSettings.peek().allowedRatings;
    });

    expect(ratings.slice(0, 3)).toEqual([toRatingMask("explicit"), toRatingMask("questionable"), toRatingMask("safe")]);
    expect(activeSession().changedSearchSettingCount.peek()).toBe(0);
  });

  test("cycles statuses through all, available, then removed", () => {
    const { handlers, activeSession } = setup();

    handlers.cycleStatus();
    const available = activeSession().searchSettings.peek().allowedStatuses;

    handlers.cycleStatus();
    expect([available, activeSession().searchSettings.peek().allowedStatuses]).toEqual([
      toPostStatusMask("active") | toPostStatusMask("deleted"),
      toPostStatusMask("purged")
    ]);
  });

  test("toggles the blacklist only on the user's own favorites", () => {
    const ownSetup = setup();
    const othersSetup = setup({ userOwnsFavorites: false });

    ownSetup.handlers.toggleBlacklist();
    othersSetup.handlers.toggleBlacklist();
    expect([ownSetup.activeSession().searchSettings.peek().isBlacklistEnabled, othersSetup.activeSession().searchSettings.peek().isBlacklistEnabled])
      .toEqual([true, false]);
  });

  test("searches elsewhere for the active tab's query", () => {
    const { handlers, activeSession, navigator } = setup();

    activeSession().submit("cat dog");
    handlers.searchElsewhere();
    expect(navigator.opened).toEqual(["#search-cat%20dog"]);
  });

  test("steps through pages, staying in bounds", () => {
    const { handlers, activeSession } = setup({ postCount: 5 });
    const pageNumbers: number[] = [];
    const record = (): void => {
      pageNumbers.push(activeSession().pageNumber.peek());
    };

    activeSession().start();
    handlers.goToPreviousPage();
    record();
    handlers.goToNextPage();
    record();
    handlers.goToLastPage();
    record();
    handlers.goToNextPage();
    record();
    handlers.goToFirstPage();
    record();
    expect(pageNumbers).toEqual([1, 2, 3, 3, 1]);
  });

  test("opens, steps between, moves and closes tabs", () => {
    const { handlers, favoritesWorkspace, activeTabIndex } = setup();
    const indexes: number[] = [];

    handlers.openNewTab();
    handlers.openNewTab();
    indexes.push(activeTabIndex());
    handlers.goToNextTab();
    indexes.push(activeTabIndex());
    handlers.goToPreviousTab();
    indexes.push(activeTabIndex());
    handlers.moveTabLeft();
    handlers.moveTabLeft();
    handlers.moveTabLeft();
    indexes.push(activeTabIndex());
    handlers.closeTab();
    expect([indexes, favoritesWorkspace.tabManager.tabs.peek().length]).toEqual([[2, 0, 2, 0], 2]);
  });

  test("steps page size by 25 and tile size by one column, within the settings' limits", () => {
    const { handlers, favoritesPreferences } = setup();
    const { pageSize } = favoritesPreferences.pagination;
    const { columnCount } = favoritesPreferences.grid;
    const pageSizes: number[] = [];

    pageSize.set(50);
    handlers.increasePageSize();
    pageSizes.push(pageSize.peek());
    pageSize.set(10);
    handlers.decreasePageSize();
    pageSizes.push(pageSize.peek());
    columnCount.set(1);
    handlers.increaseTileSize();
    const fewestColumns = columnCount.peek();

    handlers.decreaseTileSize();
    expect([pageSizes, fewestColumns, columnCount.peek()]).toEqual([[75, 1], 1, 2]);
  });

  test("cycles the layout through the settings' layouts", () => {
    const { handlers, favoritesPreferences } = setup();
    const layouts = Array.from({ length: 4 }, () => {
      handlers.cycleLayout();
      return favoritesPreferences.grid.layout.peek();
    });

    expect(layouts).toEqual(["row", "square", "native", "column"]);
  });

  test("toggles the settings pane", () => {
    const { handlers, favoritesPreferences } = setup();

    handlers.toggleSettings();
    const opened = favoritesPreferences.activeTool.peek();

    handlers.toggleSettings();
    expect([opened, favoritesPreferences.activeTool.peek()]).toEqual(["settings", null]);
  });

  test("cycles the theme, the color scheme and the gallery mode", () => {
    const { handlers, sharedPreferences, favoritesPreferences } = setup();

    handlers.cycleTheme();
    handlers.toggleColorScheme();
    handlers.cycleGalleryMode();
    expect([sharedPreferences.theme.peek(), sharedPreferences.colorScheme.peek(), favoritesPreferences.lightbox.mode.peek()])
      .toEqual(["cherry", "dark", "off"]);
  });

  test("opens the gallery on the page's first favorite, and does nothing on an empty page", () => {
    const emptySetup = setup();
    const filledSetup = setup({ postCount: 3 });

    emptySetup.handlers.openGallery();
    filledSetup.activeSession().start();
    filledSetup.activeSession().goTo(2);
    filledSetup.handlers.openGallery();
    expect(emptySetup.openLightbox).not.toHaveBeenCalled();
    expect(filledSetup.openLightbox.mock.calls).toEqual([[filledSetup.activeSession(), filledSetup.activeSession().pageFavorites.peek()[0]]]);
    expect(filledSetup.activeSession().pageNumber.peek()).toBe(2);
  });
});
