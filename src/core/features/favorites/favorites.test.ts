import { describe, expect, test } from "vitest";
import { Favorites } from "@/core/features/favorites/types/favorites";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { PaginationSettings } from "@/core/features/favorites/types/pagination";
import { Post } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { createFavorites } from "@/core/features/favorites/favorites";
import { createPost } from "@/testing/post";
import { createSearchSettings } from "@/core/features/favorites/testing/request";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  favorites: Favorites;
  remoteFavoriteActions: ObservableRemoteFavoriteActions;
  localFavorites: MemoryLocalFavorites;
  hydratedIds: string[];
}

function createPreference<T>(initial: T): Preference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set: (value: T): void => {
      signal.value = value;
    }
  };
}

// A local id with no local post loads as a placeholder, which is hydrated once its post is fetched.
async function setup(posts: Post[], { localIds = [] }: { localIds?: string[] } = {}): Promise<Setup> {
  const client = new MemoryClient(posts);
  const remoteFavoriteActions = new ObservableRemoteFavoriteActions(new MemoryRemoteFavoriteActions(client));
  const localFavorites = new MemoryLocalFavorites();
  const hydratedIds: string[] = [];

  await localFavorites.setAll(localIds);
  const favorites = createFavorites({ userOwnsFavorites: true, blacklistedTags: "" }, {
    localFavorites,
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remoteFavoriteActions,
    remotePosts: new MemoryRemotePosts(client),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource([0.25, 0.5]),
    searchSettings: createPreference(createSearchSettings()),
    paginationSettings: createPreference<PaginationSettings>({ size: 2, infiniteScroll: false }),
    waitForPaint: (): Promise<void> => Promise.resolve()
  });

  favorites.hydrated.on(favorite => hydratedIds.push(favorite.id));
  await favorites.load();
  return { favorites, remoteFavoriteActions, localFavorites, hydratedIds };
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getResultIds(favorites: Favorites): string[] {
  return favorites.searchResults.value.map(favorite => favorite.id);
}

describe("createFavorites", () => {
  test("loads the remote favorites and shows them all", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    expect(favorites.loadState.value.phase).toBe("loaded");
    expect(getResultIds(favorites)).toEqual(["1", "2", "3"]);
  });

  test("shows the favorites matching the typed query", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "apple"));

    favorites.intents.search("apple");
    expect(getResultIds(favorites)).toEqual(["1", "3"]);
  });

  test("shows what the query left out once inverted", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "apple"));

    favorites.intents.search("apple");
    favorites.intents.invert();
    expect(getResultIds(favorites)).toEqual(["2"]);
  });

  test("reorders the same favorites when shuffled", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "cherry", "date", "elderberry"));

    favorites.intents.shuffle();
    expect(getResultIds(favorites)).not.toEqual(["1", "2", "3", "4", "5"]);
    expect(getResultIds(favorites).toSorted()).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("shows the page of the results it went to", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    favorites.intents.goToPage(2);
    expect(favorites.paginationResult.value.favorites.map(favorite => favorite.id)).toEqual(["3"]);
  });

  test.each([
    { action: "search", act: (favorites: Favorites): void => favorites.intents.search("a") },
    { action: "page size change", act: (favorites: Favorites): void => favorites.intents.updatePaginationSettings({ size: 1 }) }
  ])("goes back to the first page after a $action", async({ act }) => {
    const { favorites } = await setup(createTaggedPosts("a", "a", "a", "a", "a"));

    favorites.intents.goToPage(2);
    act(favorites);
    expect(favorites.paginationResult.value.pageNumber).toBe(1);
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

    await favorites.intents.removeFavorite("1");
    await favorites.intents.addFavorite("1");
    expect(favorites.isFavorited("1")).toBe(true);
  });

  test("deletes a removed favorite from the local favorites", async() => {
    const { favorites, localFavorites } = await setup(createTaggedPosts("apple", "banana"));

    await favorites.intents.removeFavorite("1");
    await flushMicrotasks();
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });
});
