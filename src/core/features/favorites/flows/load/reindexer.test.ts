import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesReindexer } from "@/core/features/favorites/flows/load/reindexer";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { SearchRequest } from "@/core/features/favorites/types/search";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";
import { createSearchRequest } from "@/core/features/favorites/testing/request";

const TERM_UPDATE_DELAY = 1_500;
const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

interface Setup {
  reindexer: FavoritesReindexer;
  model: FavoritesModel;
  request: Signal<SearchRequest>;
  scheduler: MemoryScheduler;
}

function setup(posts: Post[] = []): Setup {
  const request = new Signal(createSearchRequest());
  const model = new FavoritesModel({ favoritedByDefault: true }, {
    request, paginationSettings: new Signal({ size: 1_000, infiniteScroll: false })
  });
  const scheduler = new MemoryScheduler();

  model.add(model.append(posts));
  return { reindexer: new FavoritesReindexer({ model, scheduler }), model, request, scheduler };
}

function searchIds({ model, request }: Setup, query: string): string[] {
  request.value = createSearchRequest({ query });
  model.search();
  return model.searchResults.value.map((favorite: Favorite) => favorite.id);
}

describe("FavoritesReindexer", () => {
  test("copies the refreshed post onto its favorite", () => {
    const { reindexer, model } = setup([createPost({ id: "1", tags: "apple" })]);

    reindexer.reindex(createPost({ id: "1", tags: "apple banana" }));
    expect(model.searchResults.value.find(favorite => favorite.id === "1")?.tags).toEqual(new Set(["apple", "banana"]));
  });

  test("makes the refreshed tags searchable once the update delay passes", () => {
    const context = setup([createPost({ id: "1", tags: "apple" })]);
    const { reindexer, scheduler } = context;

    reindexer.reindex(createPost({ id: "1", tags: "banana" }));
    scheduler.advance(TERM_UPDATE_DELAY - 1);
    expect(searchIds(context, "banana")).toEqual([]);

    scheduler.advance(1);
    expect(searchIds(context, "banana")).toEqual(["1"]);
    expect(searchIds(context, "apple")).toEqual([]);
  });

  test("ignores a post missing from the collection", () => {
    const { reindexer, model } = setup();
    const hydrated: Favorite[] = [];

    model.hydrated.on(favorite => hydrated.push(favorite));
    reindexer.reindex(createPost({ id: "9", media: MEDIA }));
    expect(hydrated).toEqual([]);
  });
});
