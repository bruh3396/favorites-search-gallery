import { afterEach, describe, expect, test } from "vitest";
import { AppContext } from "@/app/context/context";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesFlows } from "@/features/favorites/flows/flows";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesView } from "@/features/favorites/view/view";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { Post } from "@/core/domain/post/post";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";
import { createPost } from "@/testing/post";

const FRUITS: Record<string, string> = { "1": "apple", "2": "banana", "3": "apple cherry" };

let pageCounter = 0;

function createContext(...remoteIds: string[]): AppContext {
  const remote = new MemoryClient(remoteIds.map(createFruitPost));
  return createContextFor(new MemoryRemoteFavorites(remote), new MemoryRemotePosts(remote));
}

function createRefusingContext(): AppContext {
  const remote = new MemoryClient([]);
  const remoteFavorites = new MemoryRemoteFavorites(remote);

  remoteFavorites.fetchAllExcept = (): Promise<void> => Promise.reject(new Error("refused"));
  return createContextFor(remoteFavorites, new MemoryRemotePosts(remote));
}

function createContextFor(remoteFavorites: RemoteFavorites, remotePosts: RemotePosts): AppContext {
  pageCounter += 1;
  const id = `flows_test_${Date.now()}_${pageCounter}`;
  const environment = createEnvironment({ favoritesOwnerId: id });
  const shell = new Shell();

  document.body.append(shell.root);
  return createAppContext({ environment, preferences: { favorites: { layout: "grid" } }, shell, ports: { remoteFavorites, remotePosts } });
}

function loadedFor(context: AppContext): boolean {
  return context.milestones.favorites.favoritesLoaded.reached;
}

function createModel(context: AppContext): FavoritesModel {
  return new FavoritesModel(context, { onSearchResultsChanged: () => { }, onPlaceholderFilled: () => { } });
}

function createFruitPost(id: string): Post {
  return createPost({ id, tags: FRUITS[id], fetchedAt: Date.now(), media: { kind: "image", locator: `https://example.com/${id}.jpg` } });
}

async function store(context: AppContext, ...ids: string[]): Promise<void> {
  await context.ports.localPosts.setMany(ids.map(createFruitPost));
  await context.ports.localFavorites.prepend(ids);
}

function setup(context: AppContext): FavoritesFlows {
  const shell = new FavoritesShell(context.environment, context.shell);
  const view = new FavoritesView({ linksToPostPage: false }, { context, shell });

  view.setup({ onContentReplaced: () => { }, onContentAdded: () => { } });
  return new FavoritesFlows(context, createModel(context), view, new FavoritesControl({ offersTutorial: false }, { context, shell }));
}

function idsOf(context: AppContext): string[] {
  return Array.from(context.shell.content.querySelectorAll<HTMLElement>(".post")).map(thumb => thumb.id).sort();
}

function newIdsOf(context: AppContext): string[] {
  return Array.from(context.shell.content.querySelectorAll<HTMLElement>(".post[data-new-badge]")).map(thumb => thumb.id).sort();
}

function storedIdsFor(context: AppContext): Promise<string[]> {
  return createModel(context).loadFavoriteIds().then(ids => ids.sort());
}

describe("FavoritesFlows", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  describe("loading with nothing stored", () => {
    test("fetches every remote favorite, shows the favorites, and stores them", async() => {
      const context = createContext("1", "2", "3");

      await setup(context).load.loadAllFavorites();
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(await storedIdsFor(context)).toEqual(["1", "2", "3"]);
    });

    test("finishes loading without storing membership when the site refuses favorites", async() => {
      const context = createRefusingContext();

      await setup(context).load.loadAllFavorites();
      expect(loadedFor(context)).toBe(true);
      expect(await storedIdsFor(context)).toEqual([]);
    });
  });

  describe("loading with favorites stored", () => {
    test("shows the stored favorites", async() => {
      const context = createContext("1", "2", "3");

      await store(context, "1", "2", "3");
      await setup(context).load.loadAllFavorites();
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(newIdsOf(context)).toEqual([]);
    });

    test("adds favorites made since the last visit, marked as new, and stores them", async() => {
      const context = createContext("3", "1", "2");

      await store(context, "1", "2");
      await setup(context).load.loadAllFavorites();
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(newIdsOf(context)).toEqual(["3"]);
      expect(await storedIdsFor(context)).toEqual(["1", "2", "3"]);
    });

    test("still shows and finishes loading the stored favorites when the site refuses new ones", async() => {
      const context = createRefusingContext();

      await store(context, "1", "2");
      await setup(context).load.loadAllFavorites();
      expect(idsOf(context)).toEqual(["1", "2"]);
      expect(loadedFor(context)).toBe(true);
    });
  });
});
