import { Signal, effect } from "@/core/utils/reactive/signal";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesLoadFlow } from "@/core/features/favorites/flows/load/load";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { LoadPhase } from "@/core/features/favorites/types/load";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { createSearchRequest } from "@/core/features/favorites/testing/request";
import { flushMicrotasks } from "@/testing/async";

const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

interface LoadSources {
  local?: Post[];
  remote: Post[];
}

async function setup({ local = [], remote }: LoadSources): Promise<{
  flow: FavoritesLoadFlow;
  model: FavoritesModel;
  localFavorites: MemoryLocalFavorites;
  remoteFavorites: MemoryRemoteFavorites;
}> {
  const model = new FavoritesModel({ favoritedByDefault: true }, {
    request: new Signal(createSearchRequest()), paginationSettings: new Signal({ size: 1_000, infiniteScroll: false })
  });
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const client = new MemoryClient(remote);
  const remoteFavorites = new MemoryRemoteFavorites(client);
  const flow = new FavoritesLoadFlow({
    model,
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
  return { flow, model, localFavorites, remoteFavorites };
}

function recordPhases(flow: FavoritesLoadFlow): LoadPhase[] {
  const phases: LoadPhase[] = [];

  effect(() => {
    phases.push(flow.state.value.phase);
  });
  return phases;
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesLoadFlow", () => {
  test("starts in the starting phase", async() => {
    const { flow } = await setup({ remote: [] });

    expect(flow.state.value).toEqual({ phase: "starting" });
  });

  describe("load", () => {
    test("fetches every favorite and saves the membership when none is stored", async() => {
      const { flow, model, localFavorites } = await setup({ remote: createPosts("1", "2") });
      const phases = recordPhases(flow);

      await flow.load();
      expect(getIds(model.searchResults.value)).toEqual(["1", "2"]);
      expect(await localFavorites.getAll()).toEqual(["1", "2"]);
      expect(phases).toEqual(["starting", "fetching", "fetching", "fetching", "saving", "loaded"]);
    });

    test("restores the stored favorites and syncs them when a membership is stored", async() => {
      const local = [createPost({ id: "1", media: MEDIA })];
      const { flow, model } = await setup({ local, remote: [createPost({ id: "2", media: MEDIA }), ...local] });
      const phases = recordPhases(flow);

      await flow.load();
      expect(getIds(model.searchResults.value)).toEqual(["2", "1"]);
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

    test("reports an interruption and still shows the restored favorites when client refuses the sync", async() => {
      const local = [createPost({ id: "1", media: MEDIA })];
      const { flow, model, remoteFavorites } = await setup({ local, remote: local });

      vi.spyOn(remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      await flow.load();
      expect(flow.state.value).toEqual({ phase: "interrupted" });
      expect(getIds(model.searchResults.value)).toEqual(["1"]);
    });

    test("hydrates and announces a restored placeholder once its post is refreshed", async() => {
      const { flow, model } = await setup({ local: [createPost({ id: "1" })], remote: [createPost({ id: "1", tags: "apple", media: MEDIA })] });
      const hydrated: Favorite[] = [];

      model.hydrated.on(favorite => hydrated.push(favorite));
      await flow.load();
      await flushMicrotasks();
      expect(model.searchResults.value.find(favorite => favorite.id === "1")?.media).toEqual(MEDIA);
      expect(getIds(hydrated)).toEqual(["1"]);
    });
  });
});
