import { MediaItem, MediaType } from "@/types/media";
import { ParsedPost, Post } from "@/types/api";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesEnricher } from "@/features/favorites/model/enrichment/enricher";
import { TermUpdate } from "@/lib/search/engines/search_engine";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

const FRESH = Date.now();
const EXPIRED = 0;

interface FavoriteOptions {
  fetchedAt?: number;
  mediaType?: MediaType;
  duration?: number;
  tags?: string[];
}

function createFavorite(id: string, { fetchedAt, mediaType = "image", duration = 0, tags = [] }: FavoriteOptions = {}): Favorite {
  const favorite = {
    id,
    mediaType,
    post: createPost({ id, fetchedAt, duration, tags: tags.join(" ") }),
    tags: new Set(tags),
    enrich: vi.fn((post: Post) => {
      favorite.post = post;
      favorite.tags = new Set(post.tags.split(" "));
    }),
    setDuration: vi.fn((value: number) => {
      favorite.post.duration = value;
    })
  };
  return favorite as unknown as Favorite;
}

function createResolver(tagsById: Record<string, string>): (posts: Post[], onResolved: (resolved: ParsedPost) => void) => Promise<void> {
  return (posts, onResolved) => {
    posts.forEach(post => onResolved({ post: { ...post, tags: tagsById[post.id] ?? post.tags }, tagCategories: new Map() }));
    return Promise.resolve();
  };
}

function setup(overrides: {
  resolvePosts?: (posts: Post[], onResolved: (resolved: ParsedPost) => void) => Promise<void>;
  readDuration?: (item: MediaItem) => Promise<number>;
} = {}): {
  enricher: FavoritesEnricher;
  resolvePosts: ReturnType<typeof vi.fn>;
  readDuration: ReturnType<typeof vi.fn>;
  enriched: Favorite[];
  tagUpdateBatches: TermUpdate<Favorite>[][];
} {
  const enriched: Favorite[] = [];
  const tagUpdateBatches: TermUpdate<Favorite>[][] = [];
  const resolvePosts = vi.fn(overrides.resolvePosts ?? createResolver({}));
  const readDuration = vi.fn(overrides.readDuration ?? ((): Promise<number> => Promise.resolve(10)));
  const enricher = new FavoritesEnricher({
    onFavoriteEnriched: (favorite): void => {
      enriched.push(favorite);
    },
    onTagsUpdated: (updates): void => {
      tagUpdateBatches.push([...updates]);
    },
    resolvePosts,
    persistTagCategories: (): void => { },
    readDuration,
    persistPost: (): void => { }
  });
  return { enricher, resolvePosts, readDuration, enriched, tagUpdateBatches };
}

describe("FavoritesEnricher", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("resolves metadata only for stale favorites", async() => {
    const neverFetched = createFavorite("1");
    const expired = createFavorite("2", { fetchedAt: EXPIRED });
    const fresh = createFavorite("3", { fetchedAt: FRESH });
    const { enricher, resolvePosts } = setup();

    await enricher.enrich([neverFetched, expired, fresh]);
    expect(resolvePosts).toHaveBeenCalledWith([neverFetched.post, expired.post], expect.any(Function));
  });

  test("reads duration only for videos without one", async() => {
    const videoWithoutDuration = createFavorite("1", { fetchedAt: FRESH, mediaType: "video" });
    const videoWithDuration = createFavorite("2", { fetchedAt: FRESH, mediaType: "video", duration: 30 });
    const image = createFavorite("3", { fetchedAt: FRESH });
    const { enricher, readDuration } = setup();

    await enricher.enrich([videoWithoutDuration, videoWithDuration, image]);
    expect(readDuration).toHaveBeenCalledOnce();
    expect(readDuration).toHaveBeenCalledWith(videoWithoutDuration);
  });

  test("reads durations only after metadata resolution finishes", async() => {
    let finishResolving = (): void => { };
    const video = createFavorite("1", { mediaType: "video" });
    const { enricher, readDuration } = setup({
      resolvePosts: () => new Promise(resolve => {
        finishResolving = resolve;
      })
    });

    const enrichment = enricher.enrich([video]);

    await flushMicrotasks();
    expect(readDuration).not.toHaveBeenCalled();
    finishResolving();
    await enrichment;
    expect(readDuration).toHaveBeenCalledWith(video);
  });

  test("reports every favorite enriched by either metadata or duration", async() => {
    const stale = createFavorite("1");
    const video = createFavorite("2", { fetchedAt: FRESH, mediaType: "video" });
    const { enricher, enriched } = setup();

    await enricher.enrich([stale, video]);
    await flushMicrotasks();
    expect(enriched).toEqual([stale, video]);
  });

  test("coalesces tag updates until the timeout elapses", async() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    const a = createFavorite("1", { tags: ["old"] });
    const b = createFavorite("2", { tags: ["old"] });
    const { enricher, tagUpdateBatches } = setup({ resolvePosts: createResolver({ 1: "new", 2: "new" }) });

    await enricher.enrich([a, b]);
    expect(tagUpdateBatches).toHaveLength(0);
    vi.advanceTimersByTime(FavoritesConfig.apiCoalesceTimeout * 2);
    expect(tagUpdateBatches).toHaveLength(1);
    expect(tagUpdateBatches[0].map(update => update.doc)).toEqual([a, b]);
  });

  test("does nothing for an empty list", async() => {
    const { enricher, resolvePosts, readDuration, enriched } = setup();

    await enricher.enrich([]);
    expect(resolvePosts).toHaveBeenCalledWith([], expect.any(Function));
    expect(readDuration).not.toHaveBeenCalled();
    expect(enriched).toHaveLength(0);
  });
});
