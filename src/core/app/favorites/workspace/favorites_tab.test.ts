import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { StringInterner } from "@/core/utils/string/string_interner";

function setup(): FavoritesTab {
  return createFavoritesTab(new FavoritesSession({ settings: buildFavoritesSearchSettings() }, {
    searchIndex: new FavoritesSearchIndex(new StringInterner()),
    blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    favoritesPaginationPreferences: createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.pagination
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
