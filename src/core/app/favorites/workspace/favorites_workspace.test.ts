import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { describe, expect, test, vi } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC, FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { Post } from "@/core/domain/post/post";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { createPost } from "@/testing/post";
import { effect } from "@/core/utils/reactive/signal";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Setup {
  favoritesWorkspace: FavoritesWorkspace;
  localKeyedValues: MemoryLocalKeyedValues;
}

function createWorkspace(localKeyedValues: MemoryLocalKeyedValues, posts: Post[] = []): FavoritesWorkspace {
  const favoritesPaginationPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.pagination;
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());

  favoritesPaginationPreferences.pageSize.set(2);
  favoritesSearchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  return new FavoritesWorkspace({
    favoritesWorkspaceSnapshot: new KeyedStoredValue({ key: "workspace", defaultValue: DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT }, { storage: localKeyedValues, codec: FAVORITES_WORKSPACE_SNAPSHOT_CODEC }),
    createSession: (favoritesSearchSettings): FavoritesSession => {
      const favoritesSession = new FavoritesSession({ favoritesSearchSettings }, {
        favoritesSearchIndex,
        favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
        favoritesPaginationPreferences,
        randomSource: new MemoryRandomSource()
      });

      vi.spyOn(favoritesSession, "start");
      return favoritesSession;
    }
  });
}

function setup(stored?: unknown): Setup {
  const localKeyedValues = new MemoryLocalKeyedValues();

  if (stored !== undefined) {
    localKeyedValues.set("workspace", stored);
  }
  return { favoritesWorkspace: createWorkspace(localKeyedValues), localKeyedValues };
}

function createStoredWorkspace(queries: readonly string[], activeIndex = 0): unknown {
  return { tabGroups: [{ favoritesSearchSettings: queries.map(query => ({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query })), activeIndex }] };
}

function createWorkspaceWithFavorites(count: number): FavoritesWorkspace {
  const posts = Array.from({ length: count }, (_, index) => createPost({ id: String(index + 1) }));
  return createWorkspace(new MemoryLocalKeyedValues(), posts);
}

function attachTile(favoritesWorkspace: FavoritesWorkspace): HTMLElement {
  const tile = document.createElement("div");

  favoritesWorkspace.activeTab.peek().tileLocator.attach(() => tile);
  return tile;
}

function readSettings(favoritesWorkspace: FavoritesWorkspace): FavoritesSearchSettings[] {
  return favoritesWorkspace.tabManager.tabs.value.map(tab => tab.value.session.searchSettings.value);
}

function readQueries(favoritesWorkspace: FavoritesWorkspace): string[] {
  return readSettings(favoritesWorkspace).map(favoritesSearchSettings => favoritesSearchSettings.query);
}

function readActiveIndex(favoritesWorkspace: FavoritesWorkspace): number {
  return favoritesWorkspace.tabManager.tabs.value.findIndex(tab => tab.value === favoritesWorkspace.activeTab.value);
}

describe("FavoritesWorkspace", () => {
  test("opens one blank tab when nothing was saved", () => {
    const { favoritesWorkspace } = setup();

    expect(readSettings(favoritesWorkspace)).toEqual([DEFAULT_FAVORITES_SEARCH_SETTINGS]);
  });

  test("restores the saved tabs with the saved one active, starting only that one", () => {
    const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"], 1));
    const [appleFavoritesTab, bananaFavoritesTab] = favoritesWorkspace.tabManager.tabs.value.map(tab => tab.value);

    expect(readQueries(favoritesWorkspace)).toEqual(["apple", "banana"]);
    expect(favoritesWorkspace.activeTab.value).toBe(bananaFavoritesTab);
    expect([appleFavoritesTab.session.start, bananaFavoritesTab.session.start].map(start => vi.mocked(start).mock.calls.length)).toEqual([0, 1]);
  });

  test("activates the first tab when the stored active tab is missing or out of range", () => {
    const favoritesSearchSettings = [{ query: "apple" }, { query: "banana" }];

    expect([undefined, 2, -1, 0.5, "1"].map(activeIndex => readActiveIndex(setup({ tabGroups: [{ favoritesSearchSettings, activeIndex }] }).favoritesWorkspace)))
      .toEqual([0, 0, 0, 0, 0]);
  });

  test("drops a stored tab that isn't a record and keeps the rest", () => {
    const { favoritesWorkspace } = setup({ tabGroups: [{ favoritesSearchSettings: ["apple", { query: "banana" }] }] });

    expect(readQueries(favoritesWorkspace)).toEqual(["banana"]);
  });

  test("fills a stored tab's invalid field with its default", () => {
    const { favoritesWorkspace } = setup({ tabGroups: [{ favoritesSearchSettings: [{ query: "apple", sortKey: "unknown" }] }] });

    expect(readSettings(favoritesWorkspace)).toEqual([{ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "apple" }]);
  });

  test("skips a stored tab group left without tabs", () => {
    const { favoritesWorkspace } = setup({ tabGroups: [{ favoritesSearchSettings: [] }, { favoritesSearchSettings: [{ query: "apple" }] }, "pane"] });

    expect(readQueries(favoritesWorkspace)).toEqual(["apple"]);
  });

  test("opens one blank tab when no stored tab group survives", () => {
    const { favoritesWorkspace } = setup({ tabGroups: [{ favoritesSearchSettings: ["apple"] }] });

    expect(readSettings(favoritesWorkspace)).toEqual([DEFAULT_FAVORITES_SEARCH_SETTINGS]);
  });

  test("opens one blank tab when the stored workspace isn't a record", () => {
    const { favoritesWorkspace } = setup("workspace");

    expect(readSettings(favoritesWorkspace)).toEqual([DEFAULT_FAVORITES_SEARCH_SETTINGS]);
  });

  test("starts a tab's session once it is activated", () => {
    const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));
    const bananaTab = favoritesWorkspace.tabManager.tabs.value[1];

    favoritesWorkspace.tabManager.activate(bananaTab.id);
    expect(bananaTab.value.session.start).toHaveBeenCalledOnce();
  });

  test("saves the tabs and which one is active as they change", () => {
    const { favoritesWorkspace, localKeyedValues } = setup(createStoredWorkspace(["apple"]));

    favoritesWorkspace.activeTab.value.session.submit("cherry");
    favoritesWorkspace.openBlankTab();
    const reopenedFavoritesWorkspace = createWorkspace(localKeyedValues);

    expect(readQueries(reopenedFavoritesWorkspace)).toEqual(["cherry", ""]);
    expect(readActiveIndex(reopenedFavoritesWorkspace)).toBe(1);
  });

  describe("openBlankTab", () => {
    test("opens an active tab with the default settings", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple"]));

      favoritesWorkspace.openBlankTab();
      expect(favoritesWorkspace.activeTab.value.session.searchSettings.value).toEqual(DEFAULT_FAVORITES_SEARCH_SETTINGS);
    });

    test("asks the new tab to focus its search once it is active", () => {
      const { favoritesWorkspace } = setup();
      const requestedFavoritesTabs: FavoritesTab[] = [];

      effect(() => {
        const favoritesTab = favoritesWorkspace.activeTab.value;

        favoritesTab.focusSearch.on(() => requestedFavoritesTabs.push(favoritesTab));
      });
      favoritesWorkspace.openBlankTab();
      expect(requestedFavoritesTabs).toEqual([favoritesWorkspace.activeTab.peek()]);
    });
  });

  describe("closeTab", () => {
    test("closes the tab", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));

      favoritesWorkspace.closeTab(favoritesWorkspace.tabManager.tabs.value[0].id);
      expect(readQueries(favoritesWorkspace)).toEqual(["banana"]);
    });

    test("keeps the last tab open", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple"]));

      favoritesWorkspace.closeTab(favoritesWorkspace.tabManager.tabs.value[0].id);
      expect(readQueries(favoritesWorkspace)).toEqual(["apple"]);
    });
  });

  describe("closeAllTabs", () => {
    test("leaves one active blank tab", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));

      favoritesWorkspace.closeAllTabs();
      expect([readSettings(favoritesWorkspace), readActiveIndex(favoritesWorkspace)]).toEqual([[DEFAULT_FAVORITES_SEARCH_SETTINGS], 0]);
    });

    test("disposes the closed tabs' sessions", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));
      const sessions = favoritesWorkspace.tabManager.tabs.value.map(tab => vi.spyOn(tab.value.session, "dispose"));

      favoritesWorkspace.closeAllTabs();
      expect(sessions.map(dispose => dispose.mock.calls.length)).toEqual([1, 1]);
    });
  });

  describe("locate", () => {
    test("returns the active tab's tile for the item", () => {
      const favoritesWorkspace = createWorkspaceWithFavorites(1);
      const tile = attachTile(favoritesWorkspace);

      expect(favoritesWorkspace.locate(favoritesWorkspace.activeTab.peek().session.matchedFavorites.peek()[0])).toBe(tile);
    });
  });

  describe("turnToPageContaining", () => {
    test("turns the active tab to the item's page", () => {
      const favoritesWorkspace = createWorkspaceWithFavorites(3);
      const { session: favoritesSession } = favoritesWorkspace.activeTab.peek();

      favoritesWorkspace.turnToPageContaining(favoritesSession.matchedFavorites.peek()[2]);
      expect(favoritesSession.pageFavorites.value.map(favorite => favorite.id)).toEqual(["3"]);
    });
  });

  describe("reveal", () => {
    test("turns to the item's page and scrolls its tile into view", () => {
      const favoritesWorkspace = createWorkspaceWithFavorites(3);
      const { session: favoritesSession } = favoritesWorkspace.activeTab.peek();
      const tile = attachTile(favoritesWorkspace);
      const scrollIntoView = vi.fn();

      tile.scrollIntoView = scrollIntoView;
      favoritesWorkspace.reveal(favoritesSession.matchedFavorites.peek()[2]);
      expect([favoritesSession.pageFavorites.value.map(favorite => favorite.id), scrollIntoView.mock.calls.length]).toEqual([["3"], 1]);
    });

    test("returns the item's tile", () => {
      const favoritesWorkspace = createWorkspaceWithFavorites(1);
      const tile = attachTile(favoritesWorkspace);

      expect(favoritesWorkspace.reveal(favoritesWorkspace.activeTab.peek().session.matchedFavorites.peek()[0])).toBe(tile);
    });
  });

  describe("dispose", () => {
    test("stops saving the tabs", () => {
      const { favoritesWorkspace, localKeyedValues } = setup(createStoredWorkspace(["apple"]));

      favoritesWorkspace.dispose();
      favoritesWorkspace.openBlankTab();
      expect(readQueries(createWorkspace(localKeyedValues))).toEqual(["apple"]);
    });

    test("stops starting the tab that gets activated", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));
      const bananaTab = favoritesWorkspace.tabManager.tabs.value[1];

      favoritesWorkspace.dispose();
      favoritesWorkspace.tabManager.activate(bananaTab.id);
      expect(bananaTab.value.session.start).not.toHaveBeenCalled();
    });
  });
});
