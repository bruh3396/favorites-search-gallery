import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { describe, expect, test, vi } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { Post } from "@/core/domain/post/post";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { createPost } from "@/testing/post";
import { effect } from "@/core/utils/reactive/signal";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Setup {
  workspace: FavoritesWorkspace;
  storage: MemoryLocalKeyedValues;
}

function createWorkspace(storage: MemoryLocalKeyedValues, favoritesOwnerId = "1", posts: Post[] = []): FavoritesWorkspace {
  const paginationPreferences = createFavoritesPreferences(new MemoryLocalKeyedValues());
  const searchIndex = new FavoritesSearchIndex(new StringInterner());

  paginationPreferences.pageSize.set(2);
  searchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  return new FavoritesWorkspace({ favoritesOwnerId }, {
    storage,
    createSession: (settings): FavoritesSession => {
      const session = new FavoritesSession({ settings }, {
        searchIndex,
        blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
        paginationPreferences,
        randomSource: new MemoryRandomSource()
      });

      vi.spyOn(session, "start");
      return session;
    }
  });
}

function setup(stored?: unknown): Setup {
  const storage = new MemoryLocalKeyedValues();

  if (stored !== undefined) {
    storage.set("favoritesWorkspace", { 1: stored });
  }
  return { workspace: createWorkspace(storage), storage };
}

function createStoredWorkspace(queries: readonly string[], activeIndex = 0): unknown {
  return { panes: [{ tabs: queries.map(query => ({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query })), activeIndex }] };
}

function createWorkspaceWithFavorites(count: number): FavoritesWorkspace {
  const posts = Array.from({ length: count }, (_, index) => createPost({ id: String(index + 1) }));
  return createWorkspace(new MemoryLocalKeyedValues(), "1", posts);
}

function attachTile(workspace: FavoritesWorkspace): HTMLElement {
  const tile = document.createElement("div");

  workspace.activeTab.peek().tileLocator.attach(() => tile);
  return tile;
}

function readSettings(workspace: FavoritesWorkspace): FavoritesSearchSettings[] {
  return workspace.tabManager.tabs.value.map(tab => tab.value.session.settings.value);
}

function readQueries(workspace: FavoritesWorkspace): string[] {
  return readSettings(workspace).map(settings => settings.query);
}

function readActiveIndex(workspace: FavoritesWorkspace): number {
  return workspace.tabManager.tabs.value.findIndex(tab => tab.value === workspace.activeTab.value);
}

describe("FavoritesWorkspace", () => {
  test("opens one blank tab when nothing was saved", () => {
    const { workspace } = setup();

    expect(readSettings(workspace)).toEqual([DEFAULT_FAVORITES_SEARCH_SETTINGS]);
  });

  test("restores the saved tabs with the saved one active, starting only that one", () => {
    const { workspace } = setup(createStoredWorkspace(["apple", "banana"], 1));
    const [apple, banana] = workspace.tabManager.tabs.value.map(tab => tab.value);

    expect(readQueries(workspace)).toEqual(["apple", "banana"]);
    expect(workspace.activeTab.value).toBe(banana);
    expect([apple.session.start, banana.session.start].map(start => vi.mocked(start).mock.calls.length)).toEqual([0, 1]);
  });

  test("restores only the given owner's tabs", () => {
    const storage = new MemoryLocalKeyedValues();

    createWorkspace(storage, "1").activeTab.value.session.submit("apple");
    createWorkspace(storage, "2").activeTab.value.session.submit("banana");
    expect(readQueries(createWorkspace(storage, "1"))).toEqual(["apple"]);
  });

  test("activates the first tab when the stored active tab is missing or out of range", () => {
    const tabs = [{ query: "apple" }, { query: "banana" }];

    expect([undefined, 2, -1, 0.5, "1"].map(activeIndex => readActiveIndex(setup({ panes: [{ tabs, activeIndex }] }).workspace)))
      .toEqual([0, 0, 0, 0, 0]);
  });

  test("drops a stored tab that isn't a record and keeps the rest", () => {
    const { workspace } = setup({ panes: [{ tabs: ["apple", { query: "banana" }] }] });

    expect(readQueries(workspace)).toEqual(["banana"]);
  });

  test("fills a stored tab's invalid field with its default", () => {
    const { workspace } = setup({ panes: [{ tabs: [{ query: "apple", sortKey: "unknown" }] }] });

    expect(readSettings(workspace)).toEqual([{ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "apple" }]);
  });

  test("skips a stored pane left without tabs", () => {
    const { workspace } = setup({ panes: [{ tabs: [] }, { tabs: [{ query: "apple" }] }, "pane"] });

    expect(readQueries(workspace)).toEqual(["apple"]);
  });

  test("opens one blank tab when no stored pane survives", () => {
    const { workspace } = setup({ panes: [{ tabs: ["apple"] }] });

    expect(readSettings(workspace)).toEqual([DEFAULT_FAVORITES_SEARCH_SETTINGS]);
  });

  test("opens one blank tab when the stored workspace isn't a record", () => {
    const { workspace } = setup("workspace");

    expect(readSettings(workspace)).toEqual([DEFAULT_FAVORITES_SEARCH_SETTINGS]);
  });

  test("starts a tab's session once it is activated", () => {
    const { workspace } = setup(createStoredWorkspace(["apple", "banana"]));
    const banana = workspace.tabManager.tabs.value[1];

    workspace.tabManager.activate(banana.id);
    expect(banana.value.session.start).toHaveBeenCalledOnce();
  });

  test("saves the tabs and which one is active as they change", () => {
    const { workspace, storage } = setup(createStoredWorkspace(["apple"]));

    workspace.activeTab.value.session.submit("cherry");
    workspace.openBlankTab();
    const reopened = createWorkspace(storage);

    expect(readQueries(reopened)).toEqual(["cherry", ""]);
    expect(readActiveIndex(reopened)).toBe(1);
  });

  describe("openBlankTab", () => {
    test("opens an active tab with the default settings", () => {
      const { workspace } = setup(createStoredWorkspace(["apple"]));

      workspace.openBlankTab();
      expect(workspace.activeTab.value.session.settings.value).toEqual(DEFAULT_FAVORITES_SEARCH_SETTINGS);
    });

    test("asks the new tab to focus its search once it is active", () => {
      const { workspace } = setup();
      const requestedTabs: FavoritesTab[] = [];

      effect(() => {
        const tab = workspace.activeTab.value;

        tab.focusSearch.on(() => requestedTabs.push(tab));
      });
      workspace.openBlankTab();
      expect(requestedTabs).toEqual([workspace.activeTab.peek()]);
    });
  });

  describe("closeTab", () => {
    test("closes the tab", () => {
      const { workspace } = setup(createStoredWorkspace(["apple", "banana"]));

      workspace.closeTab(workspace.tabManager.tabs.value[0].id);
      expect(readQueries(workspace)).toEqual(["banana"]);
    });

    test("keeps the last tab open", () => {
      const { workspace } = setup(createStoredWorkspace(["apple"]));

      workspace.closeTab(workspace.tabManager.tabs.value[0].id);
      expect(readQueries(workspace)).toEqual(["apple"]);
    });
  });

  describe("closeAllTabs", () => {
    test("leaves one active blank tab", () => {
      const { workspace } = setup(createStoredWorkspace(["apple", "banana"]));

      workspace.closeAllTabs();
      expect([readSettings(workspace), readActiveIndex(workspace)]).toEqual([[DEFAULT_FAVORITES_SEARCH_SETTINGS], 0]);
    });

    test("disposes the closed tabs' sessions", () => {
      const { workspace } = setup(createStoredWorkspace(["apple", "banana"]));
      const sessions = workspace.tabManager.tabs.value.map(tab => vi.spyOn(tab.value.session, "dispose"));

      workspace.closeAllTabs();
      expect(sessions.map(dispose => dispose.mock.calls.length)).toEqual([1, 1]);
    });
  });

  describe("locate", () => {
    test("returns the active tab's tile for the item", () => {
      const workspace = createWorkspaceWithFavorites(1);
      const tile = attachTile(workspace);

      expect(workspace.locate(workspace.activeTab.peek().session.results.peek()[0])).toBe(tile);
    });
  });

  describe("turnToPageContaining", () => {
    test("turns the active tab to the item's page", () => {
      const workspace = createWorkspaceWithFavorites(3);
      const { session } = workspace.activeTab.peek();

      workspace.turnToPageContaining(session.results.peek()[2]);
      expect(session.pageItems.value.map(favorite => favorite.id)).toEqual(["3"]);
    });
  });

  describe("reveal", () => {
    test("turns to the item's page and scrolls its tile into view", () => {
      const workspace = createWorkspaceWithFavorites(3);
      const { session } = workspace.activeTab.peek();
      const tile = attachTile(workspace);
      const scrollIntoView = vi.fn();

      tile.scrollIntoView = scrollIntoView;
      workspace.reveal(session.results.peek()[2]);
      expect([session.pageItems.value.map(favorite => favorite.id), scrollIntoView.mock.calls.length]).toEqual([["3"], 1]);
    });

    test("returns the item's tile", () => {
      const workspace = createWorkspaceWithFavorites(1);
      const tile = attachTile(workspace);

      expect(workspace.reveal(workspace.activeTab.peek().session.results.peek()[0])).toBe(tile);
    });
  });

  describe("dispose", () => {
    test("stops saving the tabs", () => {
      const { workspace, storage } = setup(createStoredWorkspace(["apple"]));

      workspace.dispose();
      workspace.openBlankTab();
      expect(readQueries(createWorkspace(storage))).toEqual(["apple"]);
    });

    test("stops starting the tab that gets activated", () => {
      const { workspace } = setup(createStoredWorkspace(["apple", "banana"]));
      const banana = workspace.tabManager.tabs.value[1];

      workspace.dispose();
      workspace.tabManager.activate(banana.id);
      expect(banana.value.session.start).not.toHaveBeenCalled();
    });
  });
});
