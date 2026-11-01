import { FavoritesService, createFavoritesService } from "@/core/features/favorites/favorites_service";
import { describe, expect, test } from "vitest";
import { FavoritesPaginationPreferences } from "@/core/features/favorites/session/favorites_pagination";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { createPost } from "@/testing/post";
import { createStoredValue } from "@/testing/stored_value";
import { flushMicrotasks } from "@/testing/microtask_utilities";

interface Setup {
  favoritesService: FavoritesService;
  favoritesSession: FavoritesSession;
  favoritesPaginationPreferences: FavoritesPaginationPreferences;
  localFavorites: MemoryLocalFavorites;
  hydratedPostIds: string[];
}

interface Created {
  favoritesService: FavoritesService;
  memoryClient: MemoryClient;
  localFavorites: MemoryLocalFavorites;
  favoritesPaginationPreferences: FavoritesPaginationPreferences;
}

function create(posts: Post[], { userOwnsFavorites = true }: { userOwnsFavorites?: boolean } = {}): Created {
  const memoryClient = new MemoryClient(posts);
  const localFavorites = new MemoryLocalFavorites();
  const favoritesPaginationPreferences = { pageSize: createStoredValue(2), infiniteScroll: createStoredValue(false) };
  const scheduler = new MemoryScheduler();
  const favoritesService = createFavoritesService({ userOwnsFavorites, blacklistedTags: [] }, {
    localFavorites,
    remoteFavorites: new MemoryRemoteFavorites(memoryClient),
    remotePages: new MemoryRemotePages(memoryClient),
    scheduler,
    postLibrary: new PostLibrary({
      localPosts: new MemoryLocalPosts(),
      localTagCategories: new MemoryLocalTagCategories(),
      remotePosts: new MemoryRemotePosts(memoryClient),
      remoteMedia: new MemoryRemoteMedia(),
      scheduler
    }),
    randomSource: new MemoryRandomSource([0.25, 0.5]),
    favoritesPaginationPreferences
  });
  return { favoritesService, memoryClient, localFavorites, favoritesPaginationPreferences };
}

async function setup(posts: Post[], { localPostIds = [] }: { localPostIds?: string[] } = {}): Promise<Setup> {
  const { favoritesService, localFavorites, favoritesPaginationPreferences } = create(posts);
  const hydratedPostIds: string[] = [];

  await localFavorites.setAll(localPostIds);
  const favoritesSession = createStartedSession(favoritesService);

  favoritesService.hydrated.on(favorite => hydratedPostIds.push(favorite.id));
  await favoritesService.load();
  return { favoritesService, favoritesSession, favoritesPaginationPreferences, localFavorites, hydratedPostIds };
}

function readPostIds(memoryClient: MemoryClient): string[] {
  return memoryClient.readFavorites().map(post => post.id);
}

function createStartedSession(favoritesService: FavoritesService): FavoritesSession {
  const favoritesSession = favoritesService.createSession({ favoritesSearchSettings: buildFavoritesSearchSettings() });

  favoritesSession.start();
  return favoritesSession;
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getResultPostIds(favoritesSession: FavoritesSession): string[] {
  return favoritesSession.matchedFavorites.value.map(favorite => favorite.id);
}

describe("createFavoritesService", () => {
  test("loads the remote favorites and shows them all", async() => {
    const { favoritesService, favoritesSession } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    expect(favoritesService.loadState.value.phase).toBe("loaded");
    expect(getResultPostIds(favoritesSession)).toEqual(["1", "2", "3"]);
  });

  test("becomes searchable once favorites are loaded", async() => {
    const { favoritesService } = await setup(createTaggedPosts("apple"));

    expect(favoritesService.searchable.reached).toBe(true);
  });

  test("never becomes searchable without favorites", async() => {
    const { favoritesService } = await setup([]);

    expect([favoritesService.loadState.value.phase, favoritesService.searchable.reached]).toEqual(["loaded", false]);
  });
  test("counts the loaded favorites carrying a tag", async() => {
    const { favoritesService } = await setup(createTaggedPosts("apple", "banana", "apple"));

    expect(favoritesService.countFavoritesWithTag("apple")).toBe(2);
  });

  test("shows the favorites matching the typed query", async() => {
    const { favoritesSession } = await setup(createTaggedPosts("apple", "banana", "apple"));

    favoritesSession.submit("apple");
    expect(getResultPostIds(favoritesSession)).toEqual(["1", "3"]);
  });

  test("searches each session on its own", async() => {
    const { favoritesService, favoritesSession } = await setup(createTaggedPosts("apple", "banana", "apple"));
    const otherFavoritesSession = createStartedSession(favoritesService);

    favoritesSession.submit("apple");
    otherFavoritesSession.submit("banana");
    expect([getResultPostIds(favoritesSession), getResultPostIds(otherFavoritesSession)]).toEqual([["1", "3"], ["2"]]);
  });

  test("shows the page of the results it went to", async() => {
    const { favoritesSession } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    favoritesSession.goTo(2);
    expect(favoritesSession.pageFavorites.value.map(favorite => favorite.id)).toEqual(["3"]);
  });

  test("goes back to the first page when its page size changes", async() => {
    const { favoritesSession, favoritesPaginationPreferences } = await setup(createTaggedPosts("a", "a", "a", "a", "a"));

    favoritesSession.goTo(2);
    favoritesPaginationPreferences.pageSize.set(1);
    expect(favoritesSession.pageNumber.value).toBe(1);
  });

  test("publishes each placeholder once it is hydrated", async() => {
    const remoteFavoritePosts = ["1", "2"].map(id => createPost({ id, media: { kind: "image", locator: `${id}.jpg` } }));
    const { hydratedPostIds } = await setup(remoteFavoritePosts, { localPostIds: ["1", "2"] });

    await flushMicrotasks();
    expect(hydratedPostIds.toSorted()).toEqual(["1", "2"]);
  });

  test("treats every favorite on the user's own page as favorited", async() => {
    const { favoritesService } = await setup(createTaggedPosts("apple"));

    expect(favoritesService.isFavorited("1")).toBe(true);
  });

  test("blocks removing a favorite from the user's own favorites until loading finishes", async() => {
    const { favoritesService, memoryClient } = create(createTaggedPosts("apple"));

    expect(await favoritesService.actions.remove("1")).toBe(false);
    expect(readPostIds(memoryClient)).toEqual(["1"]);
    await favoritesService.load();
    expect(await favoritesService.actions.remove("1")).toBe(true);
  });

  test("removes a favorite from another user's favorites before loading finishes", async() => {
    const { favoritesService } = create(createTaggedPosts("apple"), { userOwnsFavorites: false });

    expect(await favoritesService.actions.remove("1")).toBe(true);
  });

  test("records a favorite removed through its intent", async() => {
    const { favoritesService } = await setup(createTaggedPosts("apple"));

    await favoritesService.actions.remove("1");
    expect(favoritesService.isFavorited("1")).toBe(false);
  });

  test("records a favorite added back through its intent", async() => {
    const { favoritesService } = await setup(createTaggedPosts("apple"));

    await favoritesService.actions.remove("1");
    await favoritesService.actions.add("1");
    expect(favoritesService.isFavorited("1")).toBe(true);
  });

  test("deletes a removed favorite from the local favorites", async() => {
    const { favoritesService, localFavorites } = await setup(createTaggedPosts("apple", "banana"));

    await favoritesService.actions.remove("1");
    await flushMicrotasks();
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });
});
