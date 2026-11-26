import { DEFAULT_FAVORITES_SEARCH_OPTIONS, FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC } from "@/core/app/favorites/workspace/favorites_workspace_snapshot";
import { describe, expect, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { Post } from "@/core/domain/post/post";
import { StringInterner } from "@/core/utils/string/string_interner";
import { createPost } from "@/testing/post";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { effect } from "@/core/utils/reactive/signal";

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
    favoritesWorkspaceSnapshot: new KeyedStoredValue(
      { key: "workspace", defaultValue: DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT },
      { storedValueStorage: localKeyedValues, codec: FAVORITES_WORKSPACE_SNAPSHOT_CODEC }
    ),
    createSession: (favoritesSearchOptions): FavoritesSession => {
      const favoritesSession = new FavoritesSession({ favoritesSearchOptions }, {
        favoritesSearchIndex,
        favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
        favoritesPaginationPreferences,
        randomSource: new MemoryRandomSource()
      });

      vi.spyOn(favoritesSession, "start");
      return favoritesSession;
    },
    randomSource: new MemoryRandomSource([0.25, 0.5])
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
  return { tabGroups: [{ favoritesSearchOptions: queries.map(query => ({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query })), activeIndex }] };
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

function readFavoritesSearchOptions(favoritesWorkspace: FavoritesWorkspace): FavoritesSearchOptions[] {
  return favoritesWorkspace.tabManager.tabs.value.map(tab => tab.value.session.searchOptions.value);
}

function readQueries(favoritesWorkspace: FavoritesWorkspace): string[] {
  return readFavoritesSearchOptions(favoritesWorkspace).map(favoritesSearchOptions => favoritesSearchOptions.query);
}

function readActiveIndex(favoritesWorkspace: FavoritesWorkspace): number {
  return favoritesWorkspace.tabManager.tabs.value.findIndex(tab => tab.value === favoritesWorkspace.activeTab.value);
}

describe("FavoritesWorkspace", () => {
  test("opens one blank tab when nothing was saved", () => {
    const { favoritesWorkspace } = setup();

    expect(readFavoritesSearchOptions(favoritesWorkspace)).toEqual([DEFAULT_FAVORITES_SEARCH_OPTIONS]);
  });

  test("restores the saved tabs with the saved one active, starting only that one", () => {
    const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"], 1));
    const [appleFavoritesTab, bananaFavoritesTab] = favoritesWorkspace.tabManager.tabs.value.map(tab => tab.value);

    expect(readQueries(favoritesWorkspace)).toEqual(["apple", "banana"]);
    expect(favoritesWorkspace.activeTab.value).toBe(bananaFavoritesTab);
    expect([appleFavoritesTab.session.start, bananaFavoritesTab.session.start].map(start => vi.mocked(start).mock.calls.length)).toEqual([0, 1]);
  });

  test("starts a tab's session once it is activated", () => {
    const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));
    const bananaTab = favoritesWorkspace.tabManager.tabs.value[1];

    favoritesWorkspace.tabManager.activate(bananaTab.id);
    expect(bananaTab.value.session.start).toHaveBeenCalledOnce();
  });

  test("treats the first tab as active while the active tab is closed outside a batch", () => {
    const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));
    const activeTabQueries: string[] = [];

    effect(() => activeTabQueries.push(favoritesWorkspace.activeTab.value.session.searchOptions.value.query));
    favoritesWorkspace.tabManager.close(favoritesWorkspace.tabManager.tabs.value[0].id);
    expect(activeTabQueries).toEqual(["apple", "banana"]);
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
    test("opens an active tab with the default search options and a drawn seed", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple"]));

      favoritesWorkspace.openBlankTab();
      expect(favoritesWorkspace.activeTab.value.session.searchOptions.value).toEqual({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, shuffleSeed: 2 ** 30 });
    });

    test("draws a different seed for each tab", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple"]));

      favoritesWorkspace.openBlankTab();
      favoritesWorkspace.openBlankTab();
      expect(readFavoritesSearchOptions(favoritesWorkspace).map(favoritesSearchOptions => favoritesSearchOptions.shuffleSeed)).toEqual([0, 2 ** 30, 2 ** 31]);
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

  describe("searchInNewTab", () => {
    test("opens an active tab searching the query with a drawn seed, keeping the other tabs", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple"]));

      favoritesWorkspace.searchInNewTab("banana");
      expect([readQueries(favoritesWorkspace), favoritesWorkspace.activeTab.value.session.searchOptions.value])
        .toEqual([["apple", "banana"], { ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query: "banana", shuffleSeed: 2 ** 30 }]);
    });
  });

  describe("closeTabs", () => {
    test("closes the given tabs", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana", "cherry"]));
      const [appleTab, , cherryTab] = favoritesWorkspace.tabManager.tabs.value;

      favoritesWorkspace.closeTabs([appleTab.id, cherryTab.id]);
      expect(readQueries(favoritesWorkspace)).toEqual(["banana"]);
    });

    test("leaves one active blank tab when closing every tab", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));

      favoritesWorkspace.closeTabs(favoritesWorkspace.tabManager.tabs.value.map(tab => tab.id));
      expect([readFavoritesSearchOptions(favoritesWorkspace), readActiveIndex(favoritesWorkspace)])
        .toEqual([[{ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, shuffleSeed: 2 ** 30 }], 0]);
    });

    test("disposes the closed tabs' sessions", () => {
      const { favoritesWorkspace } = setup(createStoredWorkspace(["apple", "banana"]));
      const sessions = favoritesWorkspace.tabManager.tabs.value.map(tab => vi.spyOn(tab.value.session, "dispose"));

      favoritesWorkspace.closeTabs(favoritesWorkspace.tabManager.tabs.value.map(tab => tab.id));
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
