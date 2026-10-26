import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { createSearchSettings } from "@/core/features/favorites/testing/search";
import { StringInterner } from "@/core/utils/string/string_interner";

function setup(): FavoritesTab {
  return createFavoritesTab(new FavoritesSession({ settings: createSearchSettings() }, {
    searchIndex: new FavoritesSearchIndex(new StringInterner()),
    blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    paginationSettings: createFavoritesPreferences(new MemoryLocalKeyedValues())
  }));
}

describe("createFavoritesTab", () => {
  test("titles the tab after the query", () => {
    const tab = setup();

    tab.session.submit("apple");
    expect(tab.title.value).toBe("apple");
  });

  test("titles a tab without a query New", () => {
    expect(setup().title.value).toBe("New");
  });
});
