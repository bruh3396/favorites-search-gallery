import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesReindexer } from "@/core/features/favorites/flows/load/reindexer";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { createSearchCriteria } from "@/core/features/favorites/testing/criteria";

const TERM_UPDATE_DELAY = 1_500;
const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

function setup(posts: Post[] = []): { reindexer: FavoritesReindexer; model: FavoritesModel; scheduler: MemoryScheduler } {
  const model = new FavoritesModel();
  const scheduler = new MemoryScheduler();

  model.append(posts);
  model.indexAll();
  return { reindexer: new FavoritesReindexer({ model, scheduler }), model, scheduler };
}

function searchIds(model: FavoritesModel, query: string): string[] {
  model.search(createSearchCriteria({ query }));
  return model.results.value.matches.map((favorite: Favorite) => favorite.id);
}

describe("FavoritesReindexer", () => {
  test("copies the refreshed post onto its favorite", () => {
    const { reindexer, model } = setup([createPost({ id: "1", tags: "apple" })]);

    reindexer.reindex(createPost({ id: "1", tags: "apple banana" }));
    expect(model.find("1")?.tags).toEqual(new Set(["apple", "banana"]));
  });

  test("makes the refreshed tags searchable once the update delay passes", () => {
    const { reindexer, model, scheduler } = setup([createPost({ id: "1", tags: "apple" })]);

    reindexer.reindex(createPost({ id: "1", tags: "banana" }));
    scheduler.advance(TERM_UPDATE_DELAY - 1);
    expect(searchIds(model, "banana")).toEqual([]);

    scheduler.advance(1);
    expect(searchIds(model, "banana")).toEqual(["1"]);
    expect(searchIds(model, "apple")).toEqual([]);
  });

  test("ignores a post missing from the collection", () => {
    const { reindexer, model } = setup();
    const hydrated: Favorite[] = [];

    model.hydrated.on(favorite => hydrated.push(favorite));
    reindexer.reindex(createPost({ id: "9", media: MEDIA }));
    expect(hydrated).toEqual([]);
  });
});
