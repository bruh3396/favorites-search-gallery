import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadStatePhase } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesLoader } from "@/core/features/favorites/load/favorites_loader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { StringInterner } from "@/core/utils/string/string_interner";
import { buildFavoritesSearchIndex } from "@/core/features/favorites/testing/favorites_search_index_builder";
import { effect } from "@/core/utils/reactive/signal";
import { flushMicrotasks } from "@/testing/microtask_utilities";
import { hasMedia } from "@/core/domain/media/media";
import { searchFavoritePostIds } from "@/core/features/favorites/testing/favorite_post_id_searcher";

const MEDIA = { kind: "image", locator: "1/a.jpg" } as const;

interface LoadSources {
  localFavoritePosts?: Post[];
  remoteFavoritePosts: Post[];
}

async function setup({ localFavoritePosts = [], remoteFavoritePosts }: LoadSources): Promise<{
  favoritesLoader: FavoritesLoader;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  remoteFavorites: MemoryRemoteFavorites;
  scheduler: MemoryScheduler;
}> {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = buildFavoritesSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const memoryClient = new MemoryClient(remoteFavoritePosts);
  const remoteFavorites = new MemoryRemoteFavorites(memoryClient);
  const scheduler = new MemoryScheduler();
  const favoritesLoader = new FavoritesLoader({
    favoritesCollection,
    favoritesSearchIndex,
    localFavorites,
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites,
    remotePosts: new MemoryRemotePosts(memoryClient),
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(memoryClient),
    scheduler
  });

  await localPosts.setMany(localFavoritePosts.filter(post => hasMedia(post.media)));
  await localFavorites.prepend(localFavoritePosts.map(post => post.id));
  return { favoritesLoader, favoritesCollection, favoritesSearchIndex, localFavorites, remoteFavorites, scheduler };
}

function recordPhases(favoritesLoader: FavoritesLoader): FavoritesLoadStatePhase[] {
  const phases: FavoritesLoadStatePhase[] = [];

  effect(() => {
    phases.push(favoritesLoader.state.value.phase);
  });
  return phases;
}

function getPostIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesLoader", () => {
  test("starts in the starting phase", async() => {
    const { favoritesLoader } = await setup({ remoteFavoritePosts: [] });

    expect(favoritesLoader.state.value).toEqual({ phase: "starting" });
  });

  describe("load", () => {
    test("fetches every favorite and saves the membership when none is stored", async() => {
      const { favoritesLoader, favoritesSearchIndex, localFavorites } = await setup({ remoteFavoritePosts: createPosts("1", "2") });
      const phases = recordPhases(favoritesLoader);

      await favoritesLoader.load();
      expect(searchFavoritePostIds(favoritesSearchIndex)).toEqual(["1", "2"]);
      expect(await localFavorites.getAll()).toEqual(["1", "2"]);
      expect(phases).toEqual(["starting", "fetching", "fetching", "fetching", "saving", "loaded"]);
    });

    test("restores the stored favorites and syncs them when a membership is stored", async() => {
      const localFavoritePosts = [createPost({ id: "1", media: MEDIA })];
      const { favoritesLoader, favoritesSearchIndex } = await setup({
        localFavoritePosts,
        remoteFavoritePosts: [createPost({ id: "2", media: MEDIA }), ...localFavoritePosts]
      });
      const phases = recordPhases(favoritesLoader);

      await favoritesLoader.load();
      expect(searchFavoritePostIds(favoritesSearchIndex)).toEqual(["2", "1"]);
      expect(favoritesLoader.state.value).toEqual({ phase: "loaded", newCount: 1, unfavoritedCount: 0 });
      expect(phases).toEqual(["starting", "restoring", "restoring", "pulling", "indexing", "checkingMissing", "loaded"]);
    });

    test("reports preparing while reading the stored membership takes over a second", async() => {
      const { favoritesLoader, localFavorites, scheduler } = await setup({ remoteFavoritePosts: [] });
      let finishRead: (postIds: readonly string[]) => void = () => undefined;

      vi.spyOn(localFavorites, "getAll").mockReturnValue(new Promise(resolve => {
        finishRead = resolve;
      }));
      const loading = favoritesLoader.load();

      scheduler.advance(999);
      expect(favoritesLoader.state.value).toEqual({ phase: "starting" });
      scheduler.advance(1);
      expect(favoritesLoader.state.value).toEqual({ phase: "preparing" });
      finishRead([]);
      await loading;
      expect(favoritesLoader.state.value.phase).toBe("loaded");
    });

    test("reports an interruption when the stored membership cannot be read", async() => {
      const { favoritesLoader, localFavorites } = await setup({ remoteFavoritePosts: createPosts("1") });

      vi.spyOn(localFavorites, "getAll").mockRejectedValue(new Error("upgrade failed"));
      await favoritesLoader.load();
      expect(favoritesLoader.state.value).toEqual({ phase: "interrupted" });
    });

    test("reports an interruption and saves no membership when client refuses the fetch", async() => {
      const { favoritesLoader, localFavorites, remoteFavorites } = await setup({ remoteFavoritePosts: createPosts("1") });

      vi.spyOn(remoteFavorites, "fetchAll").mockRejectedValue(new Error("refused"));
      await favoritesLoader.load();
      expect(favoritesLoader.state.value).toEqual({ phase: "interrupted" });
      expect(await localFavorites.getAll()).toEqual([]);
    });

    test("reports an interruption and still indexes the restored favorites when client refuses the sync", async() => {
      const localFavoritePosts = [createPost({ id: "1", media: MEDIA })];
      const { favoritesLoader, favoritesSearchIndex, remoteFavorites } = await setup({ localFavoritePosts, remoteFavoritePosts: localFavoritePosts });

      vi.spyOn(remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      await favoritesLoader.load();
      expect(favoritesLoader.state.value).toEqual({ phase: "interrupted" });
      expect(searchFavoritePostIds(favoritesSearchIndex)).toEqual(["1"]);
    });

    test("hydrates and announces a restored placeholder once its post is refreshed", async() => {
      const { favoritesLoader, favoritesCollection } = await setup({
        localFavoritePosts: [createPost({ id: "1" })],
        remoteFavoritePosts: [createPost({ id: "1", tags: "apple", media: MEDIA })]
      });
      const hydratedFavorites: Favorite[] = [];

      favoritesCollection.hydrated.on(favorite => hydratedFavorites.push(favorite));
      await favoritesLoader.load();
      await flushMicrotasks();
      expect(favoritesCollection.getAll().find(arenaFavorite => arenaFavorite.id === "1")?.media).toEqual(MEDIA);
      expect(getPostIds(hydratedFavorites)).toEqual(["1"]);
    });
  });
});
