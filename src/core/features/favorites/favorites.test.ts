import { FavoritesService, createFavoritesService } from "@/core/features/favorites/favorites";
import { describe, expect, test } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { FavoritesPaginationSettings } from "@/core/features/favorites/session/pagination";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";
import { createSearchSettings } from "@/core/features/favorites/testing/search";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  favorites: FavoritesService;
  session: FavoritesSession;
  paginationSettings: Preference<FavoritesPaginationSettings>;
  localFavorites: MemoryLocalFavorites;
  hydratedIds: string[];
}

interface Created {
  favorites: FavoritesService;
  client: MemoryClient;
  localFavorites: MemoryLocalFavorites;
  paginationSettings: Preference<FavoritesPaginationSettings>;
}

function createPreference<T>(initial: T): Preference<T> {
  const signal = new Signal(initial);
  const changes = new Emitter<T>();
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set: (value: T): void => {
      signal.value = value;
      changes.emit(value);
    },
    changed: changes
  };
}

function create(posts: Post[], { userOwnsFavorites = true }: { userOwnsFavorites?: boolean } = {}): Created {
  const client = new MemoryClient(posts);
  const localFavorites = new MemoryLocalFavorites();
  const paginationSettings = createPreference<FavoritesPaginationSettings>({ size: 2, infiniteScroll: false });
  const favorites = createFavoritesService({ userOwnsFavorites, blacklistedTags: [] }, {
    localFavorites,
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(client),
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource([0.25, 0.5]),
    paginationSettings
  });
  return { favorites, client, localFavorites, paginationSettings };
}

async function setup(posts: Post[], { localIds = [] }: { localIds?: string[] } = {}): Promise<Setup> {
  const { favorites, localFavorites, paginationSettings } = create(posts);
  const hydratedIds: string[] = [];

  await localFavorites.setAll(localIds);
  const session = createStartedSession(favorites);

  favorites.hydrated.on(favorite => hydratedIds.push(favorite.id));
  await favorites.load();
  return { favorites, session, paginationSettings, localFavorites, hydratedIds };
}

function readFavoriteIds(client: MemoryClient): string[] {
  return client.readFavorites().map(post => post.id);
}

function createStartedSession(favorites: FavoritesService): FavoritesSession {
  const session = favorites.createSession({ settings: createSearchSettings() });

  session.start();
  return session;
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getResultIds(session: FavoritesSession): string[] {
  return session.results.value.map(favorite => favorite.id);
}

describe("createFavoritesService", () => {
  test("loads the remote favorites and shows them all", async() => {
    const { favorites, session } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    expect(favorites.loadState.value.phase).toBe("loaded");
    expect(getResultIds(session)).toEqual(["1", "2", "3"]);
  });

  test("reaches loaded once the load finishes", async() => {
    const { favorites } = await setup(createTaggedPosts("apple"));

    expect(favorites.loaded.reached).toBe(true);
  });
  test("shows the favorites matching the typed query", async() => {
    const { session } = await setup(createTaggedPosts("apple", "banana", "apple"));

    session.submit("apple");
    expect(getResultIds(session)).toEqual(["1", "3"]);
  });

  test("searches each session on its own", async() => {
    const { favorites, session } = await setup(createTaggedPosts("apple", "banana", "apple"));
    const other = createStartedSession(favorites);

    session.submit("apple");
    other.submit("banana");
    expect([getResultIds(session), getResultIds(other)]).toEqual([["1", "3"], ["2"]]);
  });

  test("shows the page of the results it went to", async() => {
    const { session } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    session.goTo(2);
    expect(session.pageItems.value.map(favorite => favorite.id)).toEqual(["3"]);
  });

  test("goes back to the first page when its page size changes", async() => {
    const { session, paginationSettings } = await setup(createTaggedPosts("a", "a", "a", "a", "a"));

    session.goTo(2);
    paginationSettings.set({ size: 1, infiniteScroll: false });
    expect(session.pageNumber.value).toBe(1);
  });

  test("publishes each placeholder once it is hydrated", async() => {
    const remote = ["1", "2"].map(id => createPost({ id, media: { kind: "image", locator: `${id}.jpg` } }));
    const { hydratedIds } = await setup(remote, { localIds: ["1", "2"] });

    await flushMicrotasks();
    expect(hydratedIds.toSorted()).toEqual(["1", "2"]);
  });

  test("treats every favorite on the user's own page as favorited", async() => {
    const { favorites } = await setup(createTaggedPosts("apple"));

    expect(favorites.isFavorited("1")).toBe(true);
  });

  test("blocks removing a favorite from the user's own favorites until loading finishes", async() => {
    const { favorites, client } = create(createTaggedPosts("apple"));

    expect(await favorites.actions.remove("1")).toBe("blocked");
    expect(readFavoriteIds(client)).toEqual(["1"]);
    await favorites.load();
    expect(await favorites.actions.remove("1")).toBe("removed");
  });

  test("removes a favorite from another user's favorites before loading finishes", async() => {
    const { favorites } = create(createTaggedPosts("apple"), { userOwnsFavorites: false });

    expect(await favorites.actions.remove("1")).toBe("removed");
  });

  test("records a favorite removed through its intent", async() => {
    const { favorites } = await setup(createTaggedPosts("apple"));

    await favorites.actions.remove("1");
    expect(favorites.isFavorited("1")).toBe(false);
  });

  test("records a favorite added back through its intent", async() => {
    const { favorites } = await setup(createTaggedPosts("apple"));

    await favorites.actions.remove("1");
    await favorites.actions.add("1");
    expect(favorites.isFavorited("1")).toBe(true);
  });

  test("deletes a removed favorite from the local favorites", async() => {
    const { favorites, localFavorites } = await setup(createTaggedPosts("apple", "banana"));

    await favorites.actions.remove("1");
    await flushMicrotasks();
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });
});
