import { createPost, createPosts } from "@/testing/post";
import { createSearchIndex, searchIds } from "@/core/features/favorites/testing/search";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesLoader } from "@/core/features/favorites/load/loader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LoadPhase } from "@/core/features/favorites/load/state";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { effect } from "@/core/utils/reactive/signal";
import { flushMicrotasks } from "@/testing/async";

const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

interface LoadSources {
  local?: Post[];
  remote: Post[];
}

async function setup({ local = [], remote }: LoadSources): Promise<{
  flow: FavoritesLoader;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  remoteFavorites: MemoryRemoteFavorites;
}> {
  const collection = new FavoritesCollection();
  const index = createSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const client = new MemoryClient(remote);
  const remoteFavorites = new MemoryRemoteFavorites(client);
  const flow = new FavoritesLoader({
    collection,
    index,
    localFavorites,
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites,
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    waitForPaint: (): Promise<void> => Promise.resolve()
  });

  await localPosts.setMany(local.filter(post => post.media.locator !== ""));
  await localFavorites.prepend(local.map(post => post.id));
  return { flow, collection, index, localFavorites, remoteFavorites };
}

function recordPhases(flow: FavoritesLoader): LoadPhase[] {
  const phases: LoadPhase[] = [];

  effect(() => {
    phases.push(flow.state.value.phase);
  });
  return phases;
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesLoader", () => {
  test("starts in the starting phase", async() => {
    const { flow } = await setup({ remote: [] });

    expect(flow.state.value).toEqual({ phase: "starting" });
  });

  describe("load", () => {
    test("fetches every favorite and saves the membership when none is stored", async() => {
      const { flow, index, localFavorites } = await setup({ remote: createPosts("1", "2") });
      const phases = recordPhases(flow);

      await flow.load();
      expect(searchIds(index)).toEqual(["1", "2"]);
      expect(await localFavorites.getAll()).toEqual(["1", "2"]);
      expect(phases).toEqual(["starting", "fetching", "fetching", "fetching", "saving", "loaded"]);
    });

    test("restores the stored favorites and syncs them when a membership is stored", async() => {
      const local = [createPost({ id: "1", media: MEDIA })];
      const { flow, index } = await setup({ local, remote: [createPost({ id: "2", media: MEDIA }), ...local] });
      const phases = recordPhases(flow);

      await flow.load();
      expect(searchIds(index)).toEqual(["2", "1"]);
      expect(flow.state.value).toEqual({ phase: "loaded", pulledCount: 1, removedCount: 0 });
      expect(phases).toEqual(["starting", "restoring", "restoring", "pulling", "indexing", "pruning", "loaded"]);
    });

    test("reports an interruption and saves no membership when client refuses the fetch", async() => {
      const { flow, localFavorites, remoteFavorites } = await setup({ remote: createPosts("1") });

      vi.spyOn(remoteFavorites, "fetchAll").mockRejectedValue(new Error("refused"));
      await flow.load();
      expect(flow.state.value).toEqual({ phase: "interrupted" });
      expect(await localFavorites.getAll()).toEqual([]);
    });

    test("reports an interruption and still indexes the restored favorites when client refuses the sync", async() => {
      const local = [createPost({ id: "1", media: MEDIA })];
      const { flow, index, remoteFavorites } = await setup({ local, remote: local });

      vi.spyOn(remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      await flow.load();
      expect(flow.state.value).toEqual({ phase: "interrupted" });
      expect(searchIds(index)).toEqual(["1"]);
    });

    test("hydrates and announces a restored placeholder once its post is refreshed", async() => {
      const { flow, collection } = await setup({ local: [createPost({ id: "1" })], remote: [createPost({ id: "1", tags: "apple", media: MEDIA })] });
      const hydrated: Favorite[] = [];

      collection.hydrated.on(favorite => hydrated.push(favorite));
      await flow.load();
      await flushMicrotasks();
      expect(collection.getAll().find(favorite => favorite.id === "1")?.media).toEqual(MEDIA);
      expect(getIds(hydrated)).toEqual(["1"]);
    });
  });
});
