import { buildFavoritesSearchIndex } from "@/core/features/favorites/testing/favorites_search_index_builder";
import { searchFavoriteIds } from "@/core/features/favorites/testing/favorite_id_searcher";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesReindexer } from "@/core/features/favorites/load/favorites_reindexer";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { StringInterner } from "@/core/utils/string/string_interner";

const TERM_UPDATE_DELAY = 1_500;
const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

interface Setup {
  reindexer: FavoritesReindexer;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  scheduler: MemoryScheduler;
}

function setup(posts: Post[] = []): Setup {
  const collection = new FavoritesCollection(new StringInterner());
  const index = buildFavoritesSearchIndex();
  const scheduler = new MemoryScheduler();

  index.add(collection.append(posts));
  return { reindexer: new FavoritesReindexer({ collection, index, scheduler }), collection, index, scheduler };
}

describe("FavoritesReindexer", () => {
  test("copies the refreshed post onto its favorite", () => {
    const { reindexer, collection } = setup([createPost({ id: "1", tags: "apple" })]);

    reindexer.reindex(createPost({ id: "1", tags: "apple banana" }));
    expect(collection.getAll().find(favorite => favorite.id === "1")?.tags).toEqual(new Set(["apple", "banana"]));
  });

  test("makes the refreshed tags searchable once the update delay passes", () => {
    const { reindexer, index, scheduler } = setup([createPost({ id: "1", tags: "apple" })]);

    reindexer.reindex(createPost({ id: "1", tags: "banana" }));
    scheduler.advance(TERM_UPDATE_DELAY - 1);
    expect(searchFavoriteIds(index, "banana")).toEqual([]);

    scheduler.advance(1);
    expect(searchFavoriteIds(index, "banana")).toEqual(["1"]);
    expect(searchFavoriteIds(index, "apple")).toEqual([]);
  });

  test("ignores a post missing from the collection", () => {
    const { reindexer, collection } = setup();
    const hydrated: Favorite[] = [];

    collection.hydrated.on(favorite => hydrated.push(favorite));
    reindexer.reindex(createPost({ id: "9", media: MEDIA }));
    expect(hydrated).toEqual([]);
  });
});
