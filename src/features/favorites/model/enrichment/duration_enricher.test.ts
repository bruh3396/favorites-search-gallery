import { afterEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesDurationEnricher } from "@/features/favorites/model/enrichment/duration_enricher";
import { MediaItem } from "@/types/media";
import { Post } from "@/types/api";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

function createFavorite(id: string): Favorite {
  const favorite = {
    id,
    post: createPost({ id, duration: 0 }),
    setDuration: vi.fn((duration: number) => {
      favorite.post.duration = duration;
    })
  };
  return favorite as unknown as Favorite;
}

function setup(readDuration: (item: MediaItem) => Promise<number>): {
  enricher: FavoritesDurationEnricher;
  enriched: Favorite[];
  persisted: Post[];
} {
  const enriched: Favorite[] = [];
  const persisted: Post[] = [];
  const enricher = new FavoritesDurationEnricher(favorite => enriched.push(favorite), readDuration, post => persisted.push(post));
  return { enricher, enriched, persisted };
}

describe("FavoritesDurationEnricher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reads the duration of every favorite", async() => {
    const readDuration = vi.fn(() => Promise.resolve(10));
    const a = createFavorite("1");
    const b = createFavorite("2");

    setup(readDuration).enricher.enrich([a, b]);
    await flushMicrotasks();
    expect(readDuration).toHaveBeenCalledWith(a);
    expect(readDuration).toHaveBeenCalledWith(b);
  });

  test("sets the duration, persists the post, then reports the favorite", async() => {
    const favorite = createFavorite("1");
    const order: string[] = [];
    const enricher = new FavoritesDurationEnricher(
      () => order.push("enriched"),
      () => Promise.resolve(42),
      post => order.push(`persisted:${post.duration}`)
    );

    vi.mocked(favorite.setDuration).mockImplementation(duration => {
      favorite.post.duration = duration;
      order.push("set");
    });
    enricher.enrich([favorite]);
    await flushMicrotasks();

    expect(favorite.setDuration).toHaveBeenCalledWith(42);
    expect(order).toEqual(["set", "persisted:42", "enriched"]);
  });

  test("neither persists nor reports a favorite whose duration could not be read", async() => {
    vi.spyOn(console, "error").mockImplementation(() => { });
    const favorite = createFavorite("1");
    const { enricher, enriched, persisted } = setup(() => Promise.reject(new Error("boom")));

    enricher.enrich([favorite]);
    await flushMicrotasks();

    expect(favorite.setDuration).not.toHaveBeenCalled();
    expect(persisted).toHaveLength(0);
    expect(enriched).toHaveLength(0);
    expect(console.error).toHaveBeenCalledOnce();
  });

  test("one failure does not prevent other favorites from being enriched", async() => {
    vi.spyOn(console, "error").mockImplementation(() => { });
    const failing = createFavorite("1");
    const succeeding = createFavorite("2");
    const { enricher, enriched, persisted } = setup(item => (item.id === "1" ? Promise.reject(new Error("boom")) : Promise.resolve(5)));

    enricher.enrich([failing, succeeding]);
    await flushMicrotasks();

    expect(enriched).toEqual([succeeding]);
    expect(persisted).toEqual([succeeding.post]);
  });

  test("does nothing for an empty list", async() => {
    const readDuration = vi.fn(() => Promise.resolve(1));
    const { enricher, enriched } = setup(readDuration);

    enricher.enrich([]);
    await flushMicrotasks();
    expect(readDuration).not.toHaveBeenCalled();
    expect(enriched).toHaveLength(0);
  });
});
