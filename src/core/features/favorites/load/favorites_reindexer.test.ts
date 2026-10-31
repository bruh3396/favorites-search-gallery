import { buildFavoritesSearchIndex } from "@/core/features/favorites/testing/favorites_search_index_builder";
import { searchFavoritePostIds } from "@/core/features/favorites/testing/favorite_post_id_searcher";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesReindexer } from "@/core/features/favorites/load/favorites_reindexer";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { StringInterner } from "@/core/utils/string/string_interner";

const TERM_UPDATE_DELAY = 1_500;
const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

interface Setup {
  favoritesReindexer: FavoritesReindexer;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
  scheduler: MemoryScheduler;
}

function setup(posts: Post[] = []): Setup {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = buildFavoritesSearchIndex();
  const scheduler = new MemoryScheduler();

  favoritesSearchIndex.add(favoritesCollection.append(posts));
  return { favoritesReindexer: new FavoritesReindexer({ favoritesCollection, favoritesSearchIndex, scheduler }), favoritesCollection, favoritesSearchIndex, scheduler };
}

describe("FavoritesReindexer", () => {
  test("copies the refreshed post onto its favorite", () => {
    const { favoritesReindexer, favoritesCollection } = setup([createPost({ id: "1", tags: "apple" })]);

    favoritesReindexer.reindex(createPost({ id: "1", tags: "apple banana" }));
    expect(favoritesCollection.getAll().find(arenaFavorite => arenaFavorite.id === "1")?.tags).toEqual(new Set(["apple", "banana"]));
  });

  test("makes the refreshed tags searchable once the update delay passes", () => {
    const { favoritesReindexer, favoritesSearchIndex, scheduler } = setup([createPost({ id: "1", tags: "apple" })]);

    favoritesReindexer.reindex(createPost({ id: "1", tags: "banana" }));
    scheduler.advance(TERM_UPDATE_DELAY - 1);
    expect(searchFavoritePostIds(favoritesSearchIndex, "banana")).toEqual([]);

    scheduler.advance(1);
    expect(searchFavoritePostIds(favoritesSearchIndex, "banana")).toEqual(["1"]);
    expect(searchFavoritePostIds(favoritesSearchIndex, "apple")).toEqual([]);
  });

  test("ignores a post missing from the collection", () => {
    const { favoritesReindexer, favoritesCollection } = setup();
    const hydratedFavorites: Favorite[] = [];

    favoritesCollection.hydrated.on(favorite => hydratedFavorites.push(favorite));
    favoritesReindexer.reindex(createPost({ id: "9", media: MEDIA }));
    expect(hydratedFavorites).toEqual([]);
  });
});
