import { Post } from "@/core/domain/post/post";
/* eslint-disable no-spaced-func, func-call-spacing -- false positive: arrow function types inside test.each's generic confuse these rules */
import "fake-indexeddb/auto";
import { DiscreteRating, Rating } from "@/types/search";
import { addFavoriteUrl, removeFavoriteUrl } from "@/adapters/rule34/client/favorite_actions/favorite_actions";
import { postListUrlFromQuery } from "@/adapters/rule34/client/post_list_page/post_list_page";
import { postPageUrl } from "@/adapters/rule34/client/post_page/post_page";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Environment } from "@/core/boundary/environment";
import { Favorite } from "@/types/favorite";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesModel } from "@/features/favorites/model/model";
import { PreferenceOverrides } from "@/testing/preferences";
import { Rule34NetworkConfig } from "@/adapters/rule34/client/network_config";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";
import { createPost } from "@/testing/post";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { startFavorites } from "@/features/favorites/favorites";

const DEFAULT_FAVORITES_PAGE_FETCH_DELAY = Rule34NetworkConfig.favoritesPageFetchDelay;
const FRUITS: Partial<Post>[] = [
  { id: "1", tags: "apple", score: 5, rating: "s" },
  { id: "2", tags: "banana", score: 30, rating: "e" },
  { id: "3", tags: "apple cherry", score: 10, rating: "q" }
];

interface SetupOptions {
  environment?: Partial<Environment>;
  preferences?: PreferenceOverrides;
}

let pageCounter = 0;

function createContext({ environment: environmentOverrides = {}, preferences = {} }: SetupOptions = {}, withShell = true): AppContext {
  pageCounter += 1;
  const id = `startup_test_${Date.now()}_${pageCounter}`;
  const environment = createEnvironment({ favoritesId: id, ...environmentOverrides });
  const shell = withShell ? new Shell(environment) : undefined;

  if (shell !== undefined) {
    document.body.append(shell.root);
  }
  return createAppContext({ environment, preferences: { ...preferences, favorites: { layout: "grid", ...preferences.favorites } }, shell });
}

function createFruitModel(context: AppContext): FavoritesModel {
  return new FavoritesModel(context, () => { });
}

async function store(context: AppContext, posts: Partial<Post>[]): Promise<void> {
  const favorites = posts.map(post => ({ post: createPost({ ...post, fetchedAt: Date.now(), fileURL: `https://example.com/${post.id}.jpg`, previewURL: `https://example.com/thumbnails/1/thumbnail_${post.id}.jpg` }) }));

  await createFruitModel(context).storeFavorites(favorites as unknown as Favorite[]);
}

async function setup(options: SetupOptions = {}): Promise<AppContext> {
  const context = createContext(options);

  await store(context, FRUITS);
  const loaded = context.events.favorites.favoritesLoaded.wait();

  startFavorites(context);
  await loaded;
  return context;
}

function requestedUrlsOf(): string[] {
  return vi.mocked(fetch).mock.calls.map(([url]) => String(url));
}

function orderOf(context: AppContext): string[] {
  return Array.from(context.shell.content.querySelectorAll<HTMLElement>(".post")).map(thumb => thumb.id);
}

function idsOf(context: AppContext): string[] {
  return orderOf(context).sort();
}

function searchBoxOf(): HTMLTextAreaElement {
  return document.getElementById(FavoritesId.searchBox) as HTMLTextAreaElement;
}

function isFavoritedOf(context: AppContext, id: string): boolean {
  return context.shell.content.querySelector(`[id="${id}"] [data-is-favorite]`) !== null;
}

function isHiddenOf(id: string): boolean {
  return document.getElementById(id)?.dataset.hidden !== undefined;
}

function isGotoPagePopoverOpen(): boolean {
  return document.getElementById(FavoritesId.gotoPagePopover)?.dataset.open !== undefined;
}

function dispatchMouse(context: AppContext, type: "click" | "mousedown" | "mouseover", target: Element, init: MouseEventInit = {}): boolean {
  target.addEventListener(type, (event) => context.domEvents.document[type].emit(new EnhancedMouseEvent(event as MouseEvent)), { once: true });
  return target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
}

function imageOf(context: AppContext, id: string): HTMLElement {
  return context.shell.content.querySelector(`[id="${id}"] img`) as HTMLElement;
}

function heartOf(context: AppContext, id: string): HTMLElement {
  return context.shell.content.querySelector(`[id="${id}"] [data-action="favorite"]`) as HTMLElement;
}

describe("startFavorites", () => {
  beforeEach(() => {
    Rule34NetworkConfig.favoritesPageFetchDelay = 0;
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(""))));
  });

  afterEach(() => {
    Rule34NetworkConfig.favoritesPageFetchDelay = DEFAULT_FAVORITES_PAGE_FETCH_DELAY;
    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-pagination-hidden");
    document.documentElement.removeAttribute("data-loading");
    document.documentElement.removeAttribute("data-tooltips");
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("on the favorites page", () => {
    test("shows the stored favorites once they load", async() => {
      const context = await setup();

      expect(idsOf(context)).toEqual(["1", "2", "3"]);
      expect(context.shell.content.querySelector(".skeleton-item")).toBeNull();
    });


    test("serves the loaded favorites to other features", async() => {
      const { featureBridge } = await setup();

      expect(featureBridge.favorites.favorite.request("2")?.tags.has("banana")).toBe(true);
      expect(featureBridge.favorites.searchResults.request().map(favorite => favorite.id).sort()).toEqual(["1", "2", "3"]);
      expect(featureBridge.favorites.toolbar.request()?.isConnected).toBe(true);
      expect(featureBridge.favorites.usingInfiniteScroll.request()).toBe(false);
      expect(featureBridge.favorites.searchQuery.request()).toBe("");
    });

    test("offers the search results for download", async() => {
      await setup();

      expect(document.querySelector("[data-downloader-action]")?.textContent).toBe("Download 3 Results");
    });
  });

  describe("drawer sections", () => {
    test("downloading saves an archive of the search results", async() => {
      const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fruits");

      vi.spyOn(URL, "revokeObjectURL").mockReturnValue();
      await setup();
      (document.querySelector("[data-downloader-action]") as HTMLElement).click();
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob)));
    });

    test("using a snippet appends its query to the search", async() => {
      localStorage.setItem("searchSnippets", JSON.stringify([createSnippet("fruits", "apple")]));
      await setup();
      (document.querySelector("[data-snippet-name=fruits]") as HTMLElement).click();
      expect(searchBoxOf().value).toBe("apple");
    });

    test("a snippet query built from the search results finds those results", async() => {
      const context = await setup();

      context.events.favorites.searchRequested.emit("apple");
      (document.querySelector("[data-snippet-action=fillQueryFromResults]") as HTMLElement).click();
      context.events.favorites.searchRequested.emit("");
      context.events.favorites.searchRequested.emit((document.querySelector(".favorites-snippets-query-field") as HTMLTextAreaElement).value);
      expect(idsOf(context)).toEqual(["1", "3"]);
    });
  });

  describe("events", () => {
    test.each<[string, (context: AppContext) => void, string[]]>([
      ["a search request searches", (context): void => context.events.favorites.searchRequested.emit("apple"), ["1", "3"]],
      [
        "the search button searches what's typed", (context): void => {
          searchBoxOf().value = "banana";
          context.events.favorites.searchButtonClicked.emit(new MouseEvent("click"));
        }, ["2"]
      ],
      [
        "the invert button shows what the search left out", (context): void => {
          context.events.favorites.searchRequested.emit("apple");
          context.events.favorites.invertButtonClicked.emit(new MouseEvent("click"));
        }, ["2"]
      ],
      ["the scratch button excludes the most frequent tags", (context): void => context.events.favorites.scratchButtonClicked.emit(new MouseEvent("click")), ["2"]],
      ["the overlay's tag search searches that tag", (context): void => context.events.postOverlay.searchForTagRequested.emit("banana"), ["2"]]
    ])("%s", async(_, trigger, ids) => {
      const context = await setup();

      trigger(context);
      expect(idsOf(context)).toEqual(ids);
    });

    test("the shuffle button reorders the same favorites", async() => {
      const context = await setup();
      const before = orderOf(context);

      vi.spyOn(Math, "random").mockReturnValue(0);
      context.events.favorites.shuffleButtonClicked.emit(new MouseEvent("click"));
      expect(orderOf(context)).not.toEqual(before);
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
    });

    test.each<[string, (context: AppContext) => void, string]>([
      [
        "the clear button empties the search box", (context): void => {
          searchBoxOf().value = "apple";
          context.events.favorites.clearButtonClicked.emit(new MouseEvent("click"));
        }, ""
      ],
      ["the overlay's add-tag appends the tag", (context): void => context.events.postOverlay.addTagToSearchRequested.emit("cherry"), "cherry"],
      ["the overlay's exclude-tag appends the negated tag", (context): void => context.events.postOverlay.excludeTagFromSearchRequested.emit("cherry"), "-cherry"]
    ])("%s", async(_, trigger, value) => {
      const context = await setup();

      trigger(context);
      expect(searchBoxOf().value).toBe(value);
    });

    test("a post list request opens the post list", async() => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const context = await setup();

      context.events.favorites.postListRequested.emit("apple");
      expect(open).toHaveBeenCalledWith(postListUrlFromQuery("apple"));
    });

    describe("pages", () => {
      test.each<[string, (context: AppContext) => void]>([
        ["selecting a page", (context): void => context.events.favorites.pageSelected.emit(2)],
        ["stepping forward", (context): void => context.events.favorites.pageStepped.emit("ArrowRight")],
        ["submitting a page", (context): void => context.events.favorites.gotoPageSubmitted.emit(2)],
        ["another feature advancing", (context): boolean => context.featureBridge.favorites.advance.request("ArrowRight")]
      ])("%s shows the second page", async(_, trigger) => {
        const context = await setup({ preferences: { favorites: { resultsPerPage: 1 } } });

        trigger(context);
        expect(orderOf(context)).toEqual([context.featureBridge.favorites.searchResults.request()[1].id]);
      });

      test("toggling go-to-page opens its prompt, and submitting closes it", async() => {
        const context = await setup({ preferences: { favorites: { resultsPerPage: 1 } } });

        context.events.favorites.gotoPageToggled.emit();
        expect(isGotoPagePopoverOpen()).toBe(true);
        context.events.favorites.gotoPageSubmitted.emit(2);
        expect(isGotoPagePopoverOpen()).toBe(false);
      });
    });

    describe("favoriting", () => {
      test("an added favorite is marked on its thumb", async() => {
        const context = await setup({ environment: { ownsFavorites: false } });

        context.events.app.favoriteAdded.emit("2");
        expect(isFavoritedOf(context, "2")).toBe(true);
      });

      test("a removed favorite is unmarked and forgotten", async() => {
        const context = await setup();

        context.events.app.favoriteRemoved.emit("2");
        expect(isFavoritedOf(context, "2")).toBe(false);
        await vi.waitFor(async() => expect(await createFruitModel(context).countStoredFavorites()).toBe(2));
      });
    });

    describe("resetting", () => {
      test("reset, once confirmed, clears stored favorites and settings but keeps snippets", async() => {
        vi.stubGlobal("confirm", () => true);
        const context = await setup();

        localStorage.setItem("searchSnippets", "[]");
        localStorage.setItem("favoritesLayout", "\"row\"");
        context.events.favorites.resetButtonClicked.emit(new MouseEvent("click"));
        expect(localStorage.getItem("searchSnippets")).toBe("[]");
        expect(localStorage.getItem("favoritesLayout")).toBeNull();
        await vi.waitFor(async() => expect(await createFruitModel(context).countStoredFavorites()).toBe(0));
      });

      test.each<[string, Partial<Environment>, boolean]>([
        ["desktop", {}, true],
        ["mobile", { device: "mobile" }, false]
      ])("on %s, the reset prompt says whether snippets are kept", async(_, environment, mentionsSnippets) => {
        const confirm = vi.fn(() => false);

        vi.stubGlobal("confirm", confirm);
        const context = await setup({ environment });

        context.events.favorites.resetButtonClicked.emit(new MouseEvent("click"));
        expect(String(confirm.mock.calls[0]).includes("snippets")).toBe(mentionsSnippets);
      });

      test("a settings reset asks first", async() => {
        const confirm = vi.fn(() => false);

        vi.stubGlobal("confirm", confirm);
        const context = await setup();

        context.events.favorites.settingsResetRequested.emit();
        expect(confirm).toHaveBeenCalledWith("Reset all settings?");
      });

      test("a settings reset, once confirmed, forgets saved settings and reloads", async() => {
        vi.stubGlobal("confirm", () => true);
        const reload = vi.spyOn(window.location, "reload").mockReturnValue();
        const context = await setup();

        localStorage.setItem("preferences", "{\"resultsPerPage\":1}");
        context.events.favorites.settingsResetRequested.emit();
        expect(localStorage.getItem("preferences")).toBeNull();
        expect(reload).toHaveBeenCalled();
      });
    });
  });

  describe("preferences", () => {
    test.each<[string, (context: AppContext) => void, string[]]>([
      ["allowed ratings filter the results", (context): void => context.preferences.favorites.allowedRatings.set(DiscreteRating.Explicit as Rating), ["2"]],
      ["excluding the blacklist hides blacklisted favorites", (context): void => context.preferences.favorites.excludeBlacklist.set(true), ["1", "3"]]
    ])("%s", async(_, change, ids) => {
      const context = await setup({ environment: { blacklistedTags: "banana" } });

      change(context);
      expect(idsOf(context)).toEqual(ids);
    });

    test("the sort key orders the results", async() => {
      const context = await setup();

      context.preferences.favorites.sortKey.set("score");
      expect(orderOf(context)).toEqual(["2", "3", "1"]);
    });

    test("the sort direction reverses the results", async() => {
      const context = await setup();
      const before = orderOf(context);

      context.preferences.favorites.sortAscending.set(true);
      expect(orderOf(context)).toEqual([...before].reverse());
    });

    test("results per page limits the shown favorites", async() => {
      const context = await setup();

      context.preferences.favorites.resultsPerPage.set(1);
      expect(orderOf(context)).toHaveLength(1);
    });

    test("infinite scroll replaces the paginator", async() => {
      const context = await setup();

      context.preferences.favorites.infiniteScroll.set(true);
      expect(document.documentElement.dataset.paginationHidden).toBeDefined();
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
    });

    test("turning infinite scroll off brings the paginator back", async() => {
      const context = await setup({ preferences: { favorites: { infiniteScroll: true } } });

      context.preferences.favorites.infiniteScroll.set(false);
      expect(document.documentElement.dataset.paginationHidden).toBeUndefined();
      expect(idsOf(context)).toEqual(["1", "2", "3"]);
    });

    test("the drawer opens to the chosen section", async() => {
      const context = await setup();

      context.preferences.favorites.drawerOpen.set(true);
      context.preferences.favorites.drawerActiveSection.set("help");
      expect(document.getElementById(FavoritesId.root)?.dataset.drawerOpen).toBeDefined();
      expect(isHiddenOf("favorites-drawer-section-help")).toBe(false);
      expect(isHiddenOf("favorites-drawer-section-settings")).toBe(true);
    });

    test("the header follows its preference", async() => {
      const header = document.createElement("div");

      header.id = "header";
      document.body.append(header);
      const context = await setup();

      context.preferences.favorites.headerEnabled.set(false);
      expect(isHiddenOf("header")).toBe(true);
    });

    test("hints follow their preference", async() => {
      const context = await setup();

      context.preferences.favorites.hintsEnabled.set(true);
      expect(document.documentElement.dataset.tooltips).toBeDefined();
    });

    test("follows the layout preference", async() => {
      const context = await setup();

      context.preferences.favorites.layout.set("row");
      expect(context.featureBridge.favorites.layout.request()).toBe("row");
    });
  });

  describe("input", () => {
    test.each<[string, PreferenceOverrides, MouseEventInit]>([
      ["a middle-click", {}, { button: 1 }],
      ["a shift-click", {}, { button: 0, shiftKey: true }],
      ["without the gallery, a click", { app: { performanceProfile: "low" } }, { button: 0 }]
    ])("on desktop, %s on a thumb opens its post", async(_, preferences, init) => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const context = await setup({ preferences });

      dispatchMouse(context, "mousedown", imageOf(context, "2"), init);
      expect(open).toHaveBeenCalledWith(postPageUrl("2"), "_blank");
    });

    test.each<[string, (context: AppContext) => Element, MouseEventInit]>([
      ["a click on a thumb, with the gallery", (context): Element => imageOf(context, "2"), { button: 0 }],
      ["a ctrl-middle-click on a thumb", (context): Element => imageOf(context, "2"), { button: 1, ctrlKey: true }],
      ["a middle-click outside any thumb", (context): Element => context.shell.content, { button: 1 }]
    ])("on desktop, %s opens no post", async(_, targetOf, init) => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const context = await setup();

      dispatchMouse(context, "mousedown", targetOf(context), init);
      expect(open).not.toHaveBeenCalled();
    });

    test("on desktop, clicking a thumb keeps the page from following its link", async() => {
      const context = await setup();

      expect(dispatchMouse(context, "click", imageOf(context, "2"))).toBe(false);
    });

    test("on desktop, a ctrl-click on a thumb opens its media", async() => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const context = await setup();

      dispatchMouse(context, "click", imageOf(context, "2"), { ctrlKey: true });
      await vi.waitFor(() => expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/images\/.*\/2\.\w+$/), "_blank"));
    });

    test("on mobile, a middle-click on a thumb does nothing", async() => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const context = await setup({ environment: { device: "mobile" } });

      dispatchMouse(context, "mousedown", imageOf(context, "2"), { button: 1 });
      expect(open).not.toHaveBeenCalled();
    });

    test.each<[string, Partial<Environment>]>([
      ["desktop", {}],
      ["mobile", { device: "mobile" }]
    ])("on %s, clicking a thumb's heart favorites it", async(_, environment) => {
      const context = await setup({ environment: { ownsFavorites: false, ...environment } });

      dispatchMouse(context, "click", heartOf(context, "2"));
      expect(isFavoritedOf(context, "2")).toBe(true);
      await vi.waitFor(() => expect(requestedUrlsOf()).toContain(addFavoriteUrl("2")));
    });

    test("on their own favorites page, clicking a thumb's heart unfavorites and forgets it", async() => {
      const context = await setup();

      dispatchMouse(context, "click", heartOf(context, "2"));
      expect(isFavoritedOf(context, "2")).toBe(false);
      await vi.waitFor(async() => expect(await createFruitModel(context).countStoredFavorites()).toBe(2));
      await vi.waitFor(() => expect(requestedUrlsOf()).toContain(removeFavoriteUrl("2")));
    });

    test("on mobile, a swipe that ends on a thumb's heart does not favorite it", async() => {
      const context = await setup({ environment: { ownsFavorites: false, device: "mobile" } });

      vi.spyOn(context.domEvents, "didSwipe").mockReturnValue(true);
      dispatchMouse(context, "click", heartOf(context, "2"));
      expect(isFavoritedOf(context, "2")).toBe(false);
    });

    test("with Imagus support, hovering a thumb takes its link away", async() => {
      const context = await setup({ preferences: { app: { performanceProfile: "low" } } });
      const link = imageOf(context, "2").closest("a") as HTMLAnchorElement;

      expect(link.getAttribute("href")).toBe(postPageUrl("2"));
      dispatchMouse(context, "mouseover", imageOf(context, "2"));
      expect(link.getAttribute("href")).toBeNull();
    });
  });

  describe("on a post list page", () => {
    test("only serves the stored favorite ids, without touching the page", async() => {
      const context = createContext({ environment: { mode: "posts" } }, false);

      await store(context, FRUITS);
      startFavorites(context);
      expect((await context.featureBridge.favorites.favoriteIds.request()).sort()).toEqual(["1", "2", "3"]);
      expect(context.featureBridge.favorites.searchResults.request()).toEqual([]);
    });
  });

});
