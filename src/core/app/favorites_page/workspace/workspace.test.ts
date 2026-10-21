import { DEFAULT_SEARCH_SETTINGS, SearchSettings } from "@/core/features/favorites/search/inputs";
import { describe, expect, test, vi } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesWorkspace } from "@/core/app/favorites_page/workspace/workspace";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { createAppPreferences } from "@/core/app/preferences";
import { restoreWorkspace } from "@/core/app/favorites_page/workspace/stored_workspace";

interface Setup {
  workspace: FavoritesWorkspace;
  storage: MemoryLocalKeyedValues;
}

function setup(storedTabs: readonly Partial<SearchSettings>[] = []): Setup {
  const storage = new MemoryLocalKeyedValues();
  const paginationSettings = createAppPreferences(new MemoryLocalKeyedValues()).favoritesPagination;

  if (storedTabs.length > 0) {
    storage.set("favoritesWorkspace", { 1: { panes: [{ tabs: storedTabs.map(tab => ({ ...DEFAULT_SEARCH_SETTINGS, ...tab })) }] } });
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
  return workspace.tabs.tabs.value.map(tab => tab.value.session.settings.value.query);
}

function readStoredQueries(storage: MemoryLocalKeyedValues): string[] {
  return restoreWorkspace(storage, "1").panes[0].tabs.map(tab => tab.query);
}

describe("FavoritesWorkspace", () => {
  test("lands on Home with its query cleared and its other settings kept", () => {
    const { workspace } = setup([{ query: "apple", isSortAscending: true }]);

    expect(workspace.activeTab.value).toBe(workspace.homeTab);
    expect(workspace.homeTab.session.settings.value).toMatchObject({ query: "", isSortAscending: true });
  });

  test("restores the other tabs after Home without starting them", () => {
    const { workspace } = setup([{ query: "" }, { query: "banana" }]);
    const banana = workspace.tabs.tabs.value[1].value;

    expect(readQueries(workspace)).toEqual(["", "banana"]);
    expect([workspace.homeTab.session.start, banana.session.start].map(start => vi.mocked(start).mock.calls.length)).toEqual([1, 0]);
  });

  test("starts a tab's session once it is activated", () => {
    const { workspace } = setup([{ query: "" }, { query: "banana" }]);
    const banana = workspace.tabs.tabs.value[1];

    workspace.tabs.activate(banana.id);
    expect(banana.value.session.start).toHaveBeenCalledOnce();
  });

  test("keeps Home open", () => {
    const { workspace } = setup();

    workspace.tabs.close(workspace.tabs.tabs.value[0].id);
    expect(readQueries(workspace)).toEqual([""]);
  });

  describe("search", () => {
    test("opens a search from Home in a new active tab and leaves Home as it was", () => {
      const { workspace } = setup([{ query: "", isShuffled: true, isSortAscending: true }]);

      workspace.search(workspace.homeTab, "apple");
      expect(readQueries(workspace)).toEqual(["", "apple"]);
      expect(workspace.activeTab.value.session.settings.value).toMatchObject({ query: "apple", isShuffled: false, isSortAscending: true });
    });

    test("ignores an empty search from Home", () => {
      const { workspace } = setup();

      workspace.search(workspace.homeTab, "  ");
      expect(readQueries(workspace)).toEqual([""]);
    });

    test("searches another tab in place", () => {
      const { workspace } = setup([{ query: "" }, { query: "banana" }]);
      const banana = workspace.tabs.tabs.value[1].value;

      workspace.search(banana, "cherry");
      expect(readQueries(workspace)).toEqual(["", "cherry"]);
    });

    test("saves the tabs it changes", () => {
      const { workspace, storage } = setup();

      workspace.search(workspace.homeTab, "apple");
      expect(readStoredQueries(storage)).toEqual(["", "apple"]);
    });
  });
});
