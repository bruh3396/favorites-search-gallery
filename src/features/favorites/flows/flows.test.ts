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
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";
import { createPost } from "@/testing/post";

const FRUITS: Record<string, string> = { "1": "apple", "2": "banana", "3": "apple cherry" };

let pageCounter = 0;

function createContext(...remoteIds: string[]): AppContext {
  pageCounter += 1;
  const id = `flows_test_${Date.now()}_${pageCounter}`;
  const environment = createEnvironment({ favoritesOwnerId: id });
  const shell = new Shell();
  const remote = new MemoryClient(remoteIds.map(createFruitPost));

  document.body.append(shell.root);
  return createAppContext({ environment, preferences: { favorites: { layout: "grid" } }, shell, ports: { remoteFavorites: new MemoryRemoteFavorites(remote), remotePosts: new MemoryRemotePosts(remote) } });
}

function createModel(context: AppContext): FavoritesModel {
  return new FavoritesModel(context, () => { });
}

function createFruitPost(id: string): Post {
  return createPost({ id, tags: FRUITS[id], fetchedAt: Date.now(), media: { kind: "image", locator: `https://example.com/${id}.jpg` } });
}

async function store(context: AppContext, ...ids: string[]): Promise<void> {
  await context.ports.localPosts.setMany(ids.map(createFruitPost));
  await context.ports.localFavorites.prepend(ids);
}

function setup(context: AppContext): FavoritesFlows {
  const shell = new FavoritesShell(context.shell, context.environment);
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
  });
});
