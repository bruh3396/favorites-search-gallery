import { afterEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesDurationEnricher } from "@/features/favorites/model/enrichment/duration_enricher";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

function createFavorite(id: string): Favorite {
  const media: Media = { kind: "video", locator: `1/${id}.mp4` };
  const favorite = {
    id,
    media,
    post: createPost({ id, duration: 0, media }),
    setDuration: vi.fn((duration: number) => {
      favorite.post.duration = duration;
    })
  };
  return favorite as unknown as Favorite;
}

function setup(fetchDurationSeconds: (media: Media) => Promise<number>): {
  enricher: FavoritesDurationEnricher;
  enriched: Favorite[];
  persisted: Post[];
} {
  const enriched: Favorite[] = [];
  const persisted: Post[] = [];
  const enricher = new FavoritesDurationEnricher(favorite => enriched.push(favorite), fetchDurationSeconds, post => persisted.push(post));
  return { enricher, enriched, persisted };
}

describe("FavoritesDurationEnricher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reads the duration of every favorite's media", async() => {
    const fetchDurationSeconds = vi.fn(() => Promise.resolve(10));
    const a = createFavorite("1");
    const b = createFavorite("2");

    setup(fetchDurationSeconds).enricher.enrich([a, b]);
    await flushMicrotasks();
    expect(fetchDurationSeconds).toHaveBeenCalledWith(a.media);
    expect(fetchDurationSeconds).toHaveBeenCalledWith(b.media);
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
    const { enricher, enriched, persisted } = setup(media => (media === failing.media ? Promise.reject(new Error("boom")) : Promise.resolve(5)));

    enricher.enrich([failing, succeeding]);
    await flushMicrotasks();

    expect(enriched).toEqual([succeeding]);
    expect(persisted).toEqual([succeeding.post]);
  });

  test("does nothing for an empty list", async() => {
    const fetchDurationSeconds = vi.fn(() => Promise.resolve(1));
    const { enricher, enriched } = setup(fetchDurationSeconds);

    enricher.enrich([]);
    await flushMicrotasks();
    expect(fetchDurationSeconds).not.toHaveBeenCalled();
    expect(enriched).toHaveLength(0);
  });
});
