import { DEFAULT_SEARCH_SETTINGS, SearchSettings } from "@/core/features/favorites/search/inputs";
import { describe, expect, test, vi } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { createAppPreferences } from "@/core/app/preferences";
import { restoreWorkspace } from "@/core/app/favorites/workspace/stored_workspace";

interface Setup {
  workspace: FavoritesWorkspace;
  storage: MemoryLocalKeyedValues;
}

function setup(storedTabs: readonly Partial<SearchSettings>[] = [], activeIndex = 0): Setup {
  const storage = new MemoryLocalKeyedValues();
  const paginationSettings = createAppPreferences(new MemoryLocalKeyedValues()).favoritesPagination;

  if (storedTabs.length > 0) {
    storage.set("favoritesWorkspace", { 1: { panes: [{ tabs: storedTabs.map(tab => ({ ...DEFAULT_SEARCH_SETTINGS, ...tab })), activeIndex }] } });
  }
  const workspace = new FavoritesWorkspace({ favoritesOwnerId: "1" }, {
    storage,
    createSession: searchSettings => {
      const session = new FavoritesSearchSession({ searchSettings }, {
        index: new FavoritesSearchIndex(),
        blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
        paginationSettings,
        randomSource: new MemoryRandomSource()
      });

      vi.spyOn(session, "start");
      return session;
    }
  });
  return { workspace, storage };
}

function readQueries(workspace: FavoritesWorkspace): string[] {
  return workspace.tabManager.tabs.value.map(tab => tab.value.session.settings.value.query);
}

function readStoredQueries(storage: MemoryLocalKeyedValues): string[] {
  return restoreWorkspace(storage, "1").panes[0].tabs.map(tab => tab.query);
}

describe("FavoritesWorkspace", () => {
  test("opens one blank tab when nothing was saved", () => {
    const { workspace } = setup();

    expect(readQueries(workspace)).toEqual([""]);
  });

  test("restores the saved tabs with the saved one active, starting only that one", () => {
    const { workspace } = setup([{ query: "apple" }, { query: "banana" }], 1);
    const [apple, banana] = workspace.tabManager.tabs.value.map(tab => tab.value);

    expect(readQueries(workspace)).toEqual(["apple", "banana"]);
    expect(workspace.activeTab.value).toBe(banana);
    expect([apple.session.start, banana.session.start].map(start => vi.mocked(start).mock.calls.length)).toEqual([0, 1]);
  });

  test("starts a tab's session once it is activated", () => {
    const { workspace } = setup([{ query: "apple" }, { query: "banana" }]);
    const banana = workspace.tabManager.tabs.value[1];

    workspace.tabManager.activate(banana.id);
    expect(banana.value.session.start).toHaveBeenCalledOnce();
  });

  test("saves the tabs and which one is active as they change", () => {
    const { workspace, storage } = setup([{ query: "apple" }]);

    workspace.activeTab.value.session.submit("cherry");
    workspace.openBlankTab();
    expect(readStoredQueries(storage)).toEqual(["cherry", ""]);
    expect(restoreWorkspace(storage, "1").panes[0].activeIndex).toBe(1);
  });

  describe("openBlankTab", () => {
    test("opens an active tab with the default settings", () => {
      const { workspace } = setup([{ query: "apple", isSortAscending: true }]);

      workspace.openBlankTab();
      expect(workspace.activeTab.value.session.settings.value).toEqual(DEFAULT_SEARCH_SETTINGS);
    });
  });

  describe("closeTab", () => {
    test("closes the tab", () => {
      const { workspace } = setup([{ query: "apple" }, { query: "banana" }]);

      workspace.closeTab(workspace.tabManager.tabs.value[0].id);
      expect(readQueries(workspace)).toEqual(["banana"]);
    });

    test("keeps the last tab open", () => {
      const { workspace } = setup([{ query: "apple" }]);

      workspace.closeTab(workspace.tabManager.tabs.value[0].id);
      expect(readQueries(workspace)).toEqual(["apple"]);
    });
  });
});
