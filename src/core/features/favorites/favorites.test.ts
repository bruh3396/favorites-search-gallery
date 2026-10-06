import { Dimensions, Post } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
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
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { Sort } from "@/core/features/favorites/types/search";
import { createPost } from "@/testing/post";
import { createSearchCriteria } from "@/core/features/favorites/testing/criteria";
import { flushMicrotasks } from "@/testing/async";
import { startFavorites } from "@/core/features/favorites/favorites";

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
async function setup(posts: Post[], { localIds = [] }: { localIds?: string[] } = {}): Promise<{
  favorites: Favorites;
  skeletonDimensions: Preference<readonly Dimensions[]>;
  remoteFavoriteActions: ObservableRemoteFavoriteActions;
  localFavorites: MemoryLocalFavorites;
  hydratedIds: string[];
}> {
  const client = new MemoryClient(posts);
  const remoteFavoriteActions = new ObservableRemoteFavoriteActions(new MemoryRemoteFavoriteActions(client));
  const localFavorites = new MemoryLocalFavorites();
  const hydratedIds: string[] = [];
  const skeletonDimensions = createPreference<readonly Dimensions[]>(DEFAULT_SKELETON_DIMENSIONS);

  await localFavorites.setAll(localIds);
  const favorites = startFavorites({ userOwnsFavorites: true, blacklistedTags: "" }, {
    localFavorites,
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remoteFavoriteActions,
    remotePosts: new MemoryRemotePosts(client),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource(),
    preferences: {
      sort: createPreference<Sort>({ key: "favorited", isAscending: false }),
      allowedRatings: createPreference(createSearchCriteria().allowedRatings),
      isBlacklistEnabled: createPreference(false),
      resultsPerPage: createPreference(2),
      isInfiniteScrollEnabled: createPreference(false)
    },
    skeletonDimensions,
    waitForPaint: (): Promise<void> => Promise.resolve()
  });

  favorites.hydrated.on(favorite => hydratedIds.push(favorite.id));
  await favorites.finishedLoading.wait();
  return { favorites, skeletonDimensions, remoteFavoriteActions, localFavorites, hydratedIds };
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getPostIds(favorites: Favorites): string[] {
  return favorites.posts.value.map(post => post.id);
}

describe("startFavorites", () => {
  test("loads the remote favorites and shows the first page", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    expect(favorites.loadState.value.phase).toBe("loaded");
    expect(getPostIds(favorites)).toEqual(["1", "2"]);
  });

  test("searches through its intents and publishes the query", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "apple"));

    favorites.intents.search("apple");
    expect(favorites.query.value).toBe("apple");
    expect(getPostIds(favorites)).toEqual(["1", "3"]);
  });

  test("advances to the next page", async() => {
    const { favorites } = await setup(createTaggedPosts("apple", "banana", "cherry"));

    expect(await favorites.advance("forward")).toBe(true);
    expect(getPostIds(favorites)).toEqual(["3"]);
  });

  test("finds a favorite's post", async() => {
    const { favorites } = await setup(createTaggedPosts("apple"));

    expect(favorites.findPost("1")).toEqual(createPost({ id: "1", tags: "apple" }));
    expect(favorites.findPost("2")).toBeUndefined();
  });

  test("publishes each placeholder once it is hydrated", async() => {
    const remote = ["1", "2"].map(id => createPost({ id, media: { kind: "image", locator: `${id}.jpg` } }));
    const { hydratedIds } = await setup(remote, { localIds: ["1", "2"] });

    await flushMicrotasks();
    expect(hydratedIds.toSorted()).toEqual(["1", "2"]);
  });

  test("records a favorite removed by another caller of the shared port", async() => {
    const { favorites, remoteFavoriteActions } = await setup(createTaggedPosts("apple"));

    await remoteFavoriteActions.remove("1");
    expect(favorites.favoritedById.value).toEqual(new Map([["1", false]]));
  });

  test("deletes a removed favorite from the local favorites", async() => {
    const { remoteFavoriteActions, localFavorites } = await setup(createTaggedPosts("apple", "banana"));

    await remoteFavoriteActions.remove("1");
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });

  test("publishes the skeleton recorded by the last load, then records the shapes of the favorites shown", async() => {
    const { favorites, skeletonDimensions } = await setup([createPost({ id: "1", width: 4, height: 3 }), createPost({ id: "2", width: 1, height: 2 })]);

    await flushMicrotasks();
    expect(favorites.skeletonDimensions).toBe(DEFAULT_SKELETON_DIMENSIONS);
    expect(skeletonDimensions.value).toEqual([{ width: 4, height: 3 }, { width: 1, height: 2 }]);
  });
});
