import { Favorites, createFavorites } from "@/core/features/favorites/favorites";
import { describe, expect, test } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { FavoritesSearchSession, FavoritesSearchSessionSettings } from "@/core/features/favorites/search/session";
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
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Post } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";
import { createSearchSettings } from "@/core/features/favorites/testing/search";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  favorites: Favorites;
  session: FavoritesSearchSession;
  paginationSettings: Preference<PaginationSettings>;
  remoteFavoriteActions: ObservableRemoteFavoriteActions;
  localFavorites: MemoryLocalFavorites;
  hydratedIds: string[];
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

// A local id with no local post loads as a placeholder, which is hydrated once its post is fetched.
async function setup(posts: Post[], { localIds = [] }: { localIds?: string[] } = {}): Promise<Setup> {
  const client = new MemoryClient(posts);
  const remoteFavoriteActions = new ObservableRemoteFavoriteActions(new MemoryRemoteFavoriteActions(client));
  const localFavorites = new MemoryLocalFavorites();
  const hydratedIds: string[] = [];
  const paginationSettings = createPaginationSettings();

  await localFavorites.setAll(localIds);
  const favorites = createFavorites({ userOwnsFavorites: true, blacklistedTags: "" }, {
    localFavorites,
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remoteFavoriteActions,
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource([0.25, 0.5]),
    waitForPaint: (): Promise<void> => Promise.resolve()
  });
  const session = favorites.createSearchSession({ searchSettings: createPreference(createSearchSettings()), paginationSettings });

  favorites.hydrated.on(favorite => hydratedIds.push(favorite.id));
  await favorites.load();
  return { favorites, session, paginationSettings, remoteFavoriteActions, localFavorites, hydratedIds };
}

function createPaginationSettings(): Preference<PaginationSettings> {
  return createPreference<PaginationSettings>({ size: 2, infiniteScroll: false });
}

function createSessionSettings(): FavoritesSearchSessionSettings {
  return { searchSettings: createPreference(createSearchSettings()), paginationSettings: createPaginationSettings() };
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getResultIds(session: FavoritesSearchSession): string[] {
  return session.results.value.map(favorite => favorite.id);
}

describe("createFavorites", () => {
  test("loads the remote favorites and shows them all", async() => {
    const { favorites, session } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    expect(favorites.loadState.value.phase).toBe("loaded");
    expect(getResultIds(session)).toEqual(["1", "2", "3"]);
  });

  test("shows the favorites matching the typed query", async() => {
    const { session } = await setup(createTaggedPosts("apple", "banana", "apple"));

    session.submit("apple");
    expect(getResultIds(session)).toEqual(["1", "3"]);
  });

  test("searches each session on its own", async() => {
    const { favorites, session } = await setup(createTaggedPosts("apple", "banana", "apple"));
    const other = favorites.createSearchSession(createSessionSettings());

    session.submit("apple");
    other.submit("banana");
    expect([getResultIds(session), getResultIds(other)]).toEqual([["1", "3"], ["2"]]);
  });

  test("pages each session by its own page size", async() => {
    const { favorites, session } = await setup(createTaggedPosts("a", "a", "a"));
    const paginationSettings = createPaginationSettings();
    const other = favorites.createSearchSession({ ...createSessionSettings(), paginationSettings });

    paginationSettings.set({ size: 3, infiniteScroll: false });
    expect([session.paginationResult.value.totalPages, other.paginationResult.value.totalPages]).toEqual([2, 1]);
  });

  test("shows what the query left out once inverted", async() => {
    const { session } = await setup(createTaggedPosts("apple", "banana", "apple"));

    session.submit("apple");
    session.invert();
    expect(getResultIds(session)).toEqual(["2"]);
  });

  test("reorders the same favorites when shuffled", async() => {
    const { session } = await setup(createTaggedPosts("apple", "banana", "cherry", "date", "elderberry"));

    session.shuffle();
    expect(getResultIds(session)).not.toEqual(["1", "2", "3", "4", "5"]);
    expect(getResultIds(session).toSorted()).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("shows the page of the results it went to", async() => {
    const { session } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    session.goToPage(2);
    expect(session.paginationResult.value.favorites.map(favorite => favorite.id)).toEqual(["3"]);
  });

  test("goes back to the first page when its page size changes", async() => {
    const { session, paginationSettings } = await setup(createTaggedPosts("a", "a", "a", "a", "a"));

    session.goToPage(2);
    paginationSettings.set({ size: 1, infiniteScroll: false });
    expect(session.paginationResult.value.pageNumber).toBe(1);
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

  test("records a favorite removed by another caller of the shared port", async() => {
    const { favorites, remoteFavoriteActions } = await setup(createTaggedPosts("apple"));

    await remoteFavoriteActions.remove("1");
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
