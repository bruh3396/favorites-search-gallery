import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FAVORITES_WORKSPACE_SNAPSHOT_CODEC } from "@/core/app/favorites/workspace/favorites_workspace_snapshot";
import { describe, expect, test } from "vitest";
import { DEFAULT_FAVORITES_SEARCH_OPTIONS } from "@/core/features/favorites/search/favorites_search_options";

function readQueries(stored: unknown): string[] | undefined {
  return FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode(stored)?.tabGroups.flatMap(tabGroup => tabGroup.favoritesSearchOptions.map(({ query }) => query));
}

describe("DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT", () => {
  test("holds one blank tab, active", () => {
    expect(DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT).toEqual({ tabGroups: [{ favoritesSearchOptions: [DEFAULT_FAVORITES_SEARCH_OPTIONS], activeIndex: 0 }] });
  });
});

describe("FAVORITES_WORKSPACE_SNAPSHOT_CODEC", () => {
  test("decodes what it encoded", () => {
    const favoritesSearchOptions = ["apple", "banana"].map(query => ({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query }));
    const favoritesWorkspaceSnapshot = { tabGroups: [{ favoritesSearchOptions, activeIndex: 1 }] };
    const encoded = FAVORITES_WORKSPACE_SNAPSHOT_CODEC.encode(favoritesWorkspaceSnapshot);

    expect(FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode(encoded)).toEqual(favoritesWorkspaceSnapshot);
  });

  test("activates the first tab when the stored active tab is missing or out of range", () => {
    const favoritesSearchOptions = [{ query: "apple" }, { query: "banana" }];

    expect([undefined, 2, -1, 0.5, "1"]
      .map(activeIndex => FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode({ tabGroups: [{ favoritesSearchOptions, activeIndex }] })?.tabGroups[0].activeIndex))
      .toEqual([0, 0, 0, 0, 0]);
  });

  test("drops a stored tab that isn't a record and keeps the rest", () => {
    expect(readQueries({ tabGroups: [{ favoritesSearchOptions: ["apple", { query: "banana" }] }] })).toEqual(["banana"]);
  });

  test("fills a stored tab's invalid field with its default", () => {
    const stored = { tabGroups: [{ favoritesSearchOptions: [{ query: "apple", sortKey: "unknown" }] }] };
    const favoritesWorkspaceSnapshot = FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode(stored);

    expect(favoritesWorkspaceSnapshot?.tabGroups[0].favoritesSearchOptions).toEqual([{ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query: "apple" }]);
  });

  test.each([-1, 1.5, "1"])("fills a stored tab's shuffle seed %s with the default", shuffleSeed => {
    const stored = { tabGroups: [{ favoritesSearchOptions: [{ shuffleSeed }] }] };

    expect(FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode(stored)?.tabGroups[0].favoritesSearchOptions[0].shuffleSeed).toBe(0);
  });

  test("skips a stored tab group left without tabs", () => {
    expect(readQueries({ tabGroups: [{ favoritesSearchOptions: [] }, { favoritesSearchOptions: [{ query: "apple" }] }, "pane"] })).toEqual(["apple"]);
  });

  test("decodes nothing when no stored tab group survives", () => {
    expect(FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode({ tabGroups: [{ favoritesSearchOptions: ["apple"] }] })).toBeUndefined();
  });

  test("decodes nothing when the stored workspace isn't a record", () => {
    expect(FAVORITES_WORKSPACE_SNAPSHOT_CODEC.decode("workspace")).toBeUndefined();
  });
});
