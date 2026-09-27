import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesFlows } from "@/features/favorites/flows/flows";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesView } from "@/features/favorites/view/view";
import { Post } from "@/types/api";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";
import { createPost } from "@/testing/post";
import { favoritesPageUrl } from "@/lib/remote/url";

const DEFAULT_FAVORITES_PAGE_FETCH_DELAY = Rule34NetworkConfig.favoritesPageFetchDelay;
const DEFAULT_STREAM_STORED_FAVORITES_THRESHOLD = FavoritesConfig.streamStoredFavoritesThreshold;
const FRUITS: Record<string, string> = { "1": "apple", "2": "banana", "3": "apple cherry" };

let pageCounter = 0;

function createContext(): AppContext {
  pageCounter += 1;
  const id = `flows_test_${Date.now()}_${pageCounter}`;
  const environment = createEnvironment({ favoritesPageId: id, userId: id });
  const shell = new Shell(environment);

  document.body.append(shell.root);
  return createAppContext({ environment, preferences: { favorites: { layout: "grid" } }, shell });
}

function createModel(context: AppContext): FavoritesModel {
  return new FavoritesModel(context, () => { });
}

function createFruitPost(id: string): Post {
  return createPost({ id, tags: FRUITS[id], fetchedAt: Date.now(), fileURL: `https://example.com/${id}.jpg` });
}

async function store(context: AppContext, ...ids: string[]): Promise<void> {
  await createModel(context).storeFavorites(ids.map(id => ({ post: createFruitPost(id) }) as unknown as Favorite));
}

function createFavoritesPage(...ids: string[]): string {
  return ids.map(id => `<span class="thumb" id="s${id}"><a id="p${id}"><img src="https://example.com/${id}.jpg" title="${FRUITS[id]}"></a></span>`).join("");
}

function serveFavoritesPages(context: AppContext, pages: string[][]): void {
  const htmlByUrl = new Map(pages.map((ids, index) => [favoritesPageUrl(context.environment.favoritesPageId ?? "", index * FAVORITES_PER_PAGE), createFavoritesPage(...ids)]));

  vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(new Response(htmlByUrl.get(String(url)) ?? ""))));
}

function setup(context: AppContext): FavoritesFlows {
  const shell = new FavoritesShell(context.shell, context.environment);
  const view = new FavoritesView(context, shell);

  view.setup({ onContentReplaced: () => { }, onContentAdded: () => { } });
  return new FavoritesFlows(context, createModel(context), view, new FavoritesControl(context, shell));
}

function requestedUrlsOf(): string[] {
  return vi.mocked(fetch).mock.calls.map(([url]) => String(url));
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
  beforeEach(() => {
    Rule34NetworkConfig.favoritesPageFetchDelay = 0;
  });

  afterEach(() => {
    Rule34NetworkConfig.favoritesPageFetchDelay = DEFAULT_FAVORITES_PAGE_FETCH_DELAY;
    FavoritesConfig.streamStoredFavoritesThreshold = DEFAULT_STREAM_STORED_FAVORITES_THRESHOLD;
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  describe("loading with nothing stored", () => {
    test("fetches every favorites page, shows the favorites, and stores them", async() => {
      const context = createContext();

      serveFavoritesPages(context, [["1", "2", "3"]]);
      await setup(context).load.loadAllFavorites(undefined);
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(await storedIdsFor(context)).toEqual(["1", "2", "3"]);
    });

    test("starts from the favorites already on the page instead of fetching the first page again", async() => {
      const context = createContext();

      serveFavoritesPages(context, [[], ["2", "3"]]);
      await setup(context).load.loadAllFavorites([createFruitPost("1")]);
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(await storedIdsFor(context)).toEqual(["1", "2", "3"]);
      expect(requestedUrlsOf()).not.toContain(favoritesPageUrl(context.environment.favoritesPageId ?? "", 0));
    });
  });

  describe("loading with favorites stored", () => {
    test.each([0, 10])("shows the stored favorites (streaming above %i)", async(threshold) => {
      FavoritesConfig.streamStoredFavoritesThreshold = threshold;
      const context = createContext();

      await store(context, "1", "2", "3");
      serveFavoritesPages(context, [["1", "2", "3"]]);
      await setup(context).load.loadAllFavorites(undefined);
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(newIdsOf(context)).toEqual([]);
    });

    test("adds favorites made since the last visit, marked as new, and stores them", async() => {
      const context = createContext();

      await store(context, "1", "2");
      serveFavoritesPages(context, [["3", "1", "2"]]);
      await setup(context).load.loadAllFavorites(undefined);
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(newIdsOf(context)).toEqual(["3"]);
      expect(await storedIdsFor(context)).toEqual(["1", "2", "3"]);
    });
  });
});
