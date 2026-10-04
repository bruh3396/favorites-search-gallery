/* eslint-disable no-spaced-func, func-call-spacing -- false positive: arrow function types inside test.each's generic confuse these rules */
import { DiscreteRating, Rating } from "@/types/search";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Environment } from "@/core/boundary/environment";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesModel } from "@/features/favorites/model/model";
import { Feature } from "@/core/context/features";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { Post } from "@/core/domain/post/post";
import { PreferenceOverrides } from "@/testing/preferences";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";
import { createPost } from "@/testing/post";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { startFavorites } from "@/features/favorites/favorites";

const FRUITS: Partial<Post>[] = [
  { id: "1", tags: "apple", score: 5, rating: "s" },
  { id: "2", tags: "banana", score: 30, rating: "e" },
  { id: "3", tags: "apple cherry", score: 10, rating: "q" }
];

interface SetupOptions {
  environment?: Partial<Environment>;
  preferences?: PreferenceOverrides;
  features?: Feature[];
  localKeyedValues?: MemoryLocalKeyedValues;
  hostPage?: MemoryHostPage;
  navigator?: MemoryNavigator;
  remote?: MemoryClient;
}

let pageCounter = 0;

function createFruitPosts(): Post[] {
  return FRUITS.map(post => createPost({ ...post, fetchedAt: Date.now(), media: { kind: "image", locator: `data:text/plain,${post.id}` } }));
}

function createRemote(): MemoryClient {
  return new MemoryClient(createFruitPosts());
}

function createContext(
  { environment: environmentOverrides = {},
    preferences = {},
    features,
    localKeyedValues = new MemoryLocalKeyedValues(),
    hostPage = new MemoryHostPage(),
    navigator = new MemoryNavigator(),
    remote = createRemote() }: SetupOptions = {},
  withShell = true
): AppContext {
  pageCounter += 1;
  const id = `startup_test_${Date.now()}_${pageCounter}`;
  const environment = createEnvironment({ favoritesOwnerId: id, ...environmentOverrides });
  const shell = withShell ? new Shell() : undefined;
  const ports = {
    localKeyedValues,
    hostPage,
    navigator,
    remoteFavorites: new MemoryRemoteFavorites(remote),
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(remote),
    remotePosts: new MemoryRemotePosts(remote)
  };

  if (shell !== undefined) {
    document.body.append(shell.root);
  }
  return createAppContext({ environment, preferences: { ...preferences, favorites: { layout: "grid", ...preferences.favorites } }, features, shell, ports });
}

function createFruitModel(context: AppContext): FavoritesModel {
  return new FavoritesModel(context, { onSearchResultsChanged: (): void => { }, onPlaceholderFilled: (): void => { } });
}

async function store(context: AppContext): Promise<void> {
  const local = createFruitPosts();

  await context.ports.localPosts.setMany(local);
  await context.ports.localFavorites.prepend(local.map(post => post.id));
}

async function setup(options: SetupOptions = {}): Promise<AppContext> {
  const context = createContext(options);

  await store(context);
  const loaded = context.milestones.favorites.favoritesLoaded.wait();

  startFavorites(context);
  await loaded;
  return context;
}

function readRemoteFavoriteIds(remote: MemoryClient): string[] {
  return remote.readFavorites().map(post => post.id);
}

function readThumbOrder(context: AppContext): string[] {
  return Array.from(context.shell.content.querySelectorAll<HTMLElement>(".post")).map(thumb => thumb.id);
}

function readSortedThumbIds(context: AppContext): string[] {
  return readThumbOrder(context).sort();
}

function querySearchBox(): HTMLTextAreaElement {
  return document.getElementById(FavoritesId.searchBox) as HTMLTextAreaElement;
}

function hasFavorite(context: AppContext, id: string): boolean {
  return context.shell.content.querySelector(`[id="${id}"] [data-is-favorite]`) !== null;
}

function isHidden(id: string): boolean {
  return document.getElementById(id)?.dataset.hidden !== undefined;
}

function isGotoPagePopoverOpen(): boolean {
  return document.getElementById(FavoritesId.gotoPagePopover)?.dataset.open !== undefined;
}

function dispatchMouse(context: AppContext, type: "click" | "mousedown" | "mouseover", target: Element, init: MouseEventInit = {}): boolean {
  target.addEventListener(type, (event) => context.domEvents.document[type].emit(new EnhancedMouseEvent(event as MouseEvent)), { once: true });
  return target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
}

function queryImage(context: AppContext, id: string): HTMLElement {
  return context.shell.content.querySelector(`[id="${id}"] img`) as HTMLElement;
}

function queryHeart(context: AppContext, id: string): HTMLElement {
  return context.shell.content.querySelector(`[id="${id}"] [data-action="favorite"]`) as HTMLElement;
}

function readStatus(): string | null {
  return document.getElementById(FavoritesId.loadStatus)?.textContent ?? null;
}

async function startFavoritesMidLoad(options: SetupOptions = {}): Promise<AppContext> {
  const context = createContext(options);

  await store(context);
  vi.spyOn(context.ports.remoteFavorites, "findRemoved").mockReturnValue(new Promise(() => { }));
  startFavorites(context);
  await vi.waitFor(() => expect(queryHeart(context, "2")).not.toBeNull());
  return context;
}

describe("startFavorites", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-pagination-hidden");
    document.documentElement.removeAttribute("data-loading");
    document.documentElement.removeAttribute("data-tooltips");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("on the favorites page", () => {
    test("shows the local favorites once they load", async() => {
      const context = await setup();

      expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
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

    test("forgets local favorites unfavorited on Rule34 but keeps their posts", async() => {
      const remote = createRemote();

      remote.removeFavorite("2");
      const context = await setup({ remote });

      expect((await createFruitModel(context).loadFavoriteIds()).sort()).toEqual(["1", "3"]);
      expect(await context.ports.localPosts.getMany(["2"])).toHaveLength(1);
    });

    test("keeps every local favorite when Rule34 refuses the removal check", async() => {
      const context = createContext();

      await store(context);
      vi.spyOn(context.ports.remoteFavorites, "findRemoved").mockRejectedValue(new Error("refused"));
      const loaded = context.milestones.favorites.favoritesLoaded.wait();

      startFavorites(context);
      await loaded;
      expect(await createFruitModel(context).loadFavoriteIds()).toHaveLength(3);
    });

    test("finishes loading and says so when Rule34 refuses new favorites", async() => {
      const context = createContext();

      await store(context);
      vi.spyOn(context.ports.remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      const loaded = context.milestones.favorites.favoritesLoaded.wait();

      startFavorites(context);
      await loaded;
      expect(readStatus()).toBe("Rule34 stopped sending favorites, try again later");
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
      const localKeyedValues = new MemoryLocalKeyedValues();

      localKeyedValues.set("searchSnippets", [createSnippet("fruits", "apple")]);
      await setup({ localKeyedValues });
      (document.querySelector("[data-snippet-name=fruits]") as HTMLElement).click();
      expect(querySearchBox().value).toBe("apple");
    });

    test("a snippet query built from the search results finds those results", async() => {
      const context = await setup();

      context.events.favorites.searchRequested.emit("apple");
      (document.querySelector("[data-snippet-action=fillQueryFromResults]") as HTMLElement).click();
      context.events.favorites.searchRequested.emit("");
      context.events.favorites.searchRequested.emit((document.querySelector(".favorites-snippets-query-field") as HTMLTextAreaElement).value);
      expect(readSortedThumbIds(context)).toEqual(["1", "3"]);
    });
  });

  describe("events", () => {
    test.each<[string, (context: AppContext) => void, string[]]>([
      ["a search request searches", (context): void => context.events.favorites.searchRequested.emit("apple"), ["1", "3"]],
      [
        "the search button searches what's typed", (context): void => {
          querySearchBox().value = "banana";
          context.events.favorites.searchButtonClicked.emit(new MouseEvent("click"));
        }, ["2"]
      ],
      [
        "the invert button shows what the search left out", (context): void => {
          context.events.favorites.searchRequested.emit("apple");
          context.events.favorites.invertButtonClicked.emit(new MouseEvent("click"));
        }, ["2"]
      ],
      ["the overlay's tag search searches that tag", (context): void => context.events.postOverlay.searchForTagRequested.emit("banana"), ["2"]]
    ])("%s", async(_, trigger, ids) => {
      const context = await setup();

      trigger(context);
      expect(readSortedThumbIds(context)).toEqual(ids);
    });

    test("the shuffle button reorders the same favorites", async() => {
      const context = await setup();
      const before = readThumbOrder(context);

      context.events.favorites.shuffleButtonClicked.emit(new MouseEvent("click"));
      expect(readThumbOrder(context)).not.toEqual(before);
      expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
    });

    test.each<[string, (context: AppContext) => void, string]>([
      [
        "the clear button empties the search box", (context): void => {
          querySearchBox().value = "apple";
          context.events.favorites.clearButtonClicked.emit(new MouseEvent("click"));
        }, ""
      ],
      ["the overlay's add-tag appends the tag", (context): void => context.events.postOverlay.addTagToSearchRequested.emit("cherry"), "cherry"],
      ["the overlay's exclude-tag appends the negated tag", (context): void => context.events.postOverlay.excludeTagFromSearchRequested.emit("cherry"), "-cherry"]
    ])("%s", async(_, trigger, value) => {
      const context = await setup();

      trigger(context);
      expect(querySearchBox().value).toBe(value);
    });

    test("a post list request opens the post list", async() => {
      const navigator = new MemoryNavigator();
      const context = await setup({ navigator });

      context.events.favorites.postListRequested.emit("apple");
      expect(navigator.opened).toEqual(["#search-apple"]);
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
        expect(readThumbOrder(context)).toEqual([context.featureBridge.favorites.searchResults.request()[1].id]);
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
        expect(hasFavorite(context, "2")).toBe(true);
      });

      test("a removed favorite is unmarked and forgotten", async() => {
        const context = await setup();

        context.events.app.favoriteRemoved.emit("2");
        expect(hasFavorite(context, "2")).toBe(false);
        await vi.waitFor(async() => expect(await createFruitModel(context).loadFavoriteIds()).toHaveLength(2));
      });
    });

    describe("resetting settings", () => {
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
        const resetPreferences = vi.spyOn(context.preferences, "reset");

        context.events.favorites.settingsResetRequested.emit();
        expect(resetPreferences).toHaveBeenCalled();
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
      expect(readSortedThumbIds(context)).toEqual(ids);
    });

    test("the sort key orders the results", async() => {
      const context = await setup();

      context.preferences.favorites.sortKey.set("score");
      expect(readThumbOrder(context)).toEqual(["2", "3", "1"]);
    });

    test("the sort direction reverses the results", async() => {
      const context = await setup();
      const before = readThumbOrder(context);

      context.preferences.favorites.sortAscending.set(true);
      expect(readThumbOrder(context)).toEqual([...before].reverse());
    });

    test("results per page limits the shown favorites", async() => {
      const context = await setup();

      context.preferences.favorites.resultsPerPage.set(1);
      expect(readThumbOrder(context)).toHaveLength(1);
    });

    test("infinite scroll replaces the paginator", async() => {
      const context = await setup();

      context.preferences.favorites.infiniteScroll.set(true);
      expect(document.documentElement.dataset.paginationHidden).toBeDefined();
      expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
    });

    test("turning infinite scroll off brings the paginator back", async() => {
      const context = await setup({ preferences: { favorites: { infiniteScroll: true } } });

      context.preferences.favorites.infiniteScroll.set(false);
      expect(document.documentElement.dataset.paginationHidden).toBeUndefined();
      expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
    });

    test("the drawer starts as its preferences say", async() => {
      await setup({ preferences: { favorites: { drawerOpen: true, drawerActiveSection: "help" } } });

      expect(document.getElementById(FavoritesId.root)?.dataset.drawerOpen).toBeDefined();
      expect(isHidden("favorites-drawer-section-help")).toBe(false);
      expect(isHidden("favorites-drawer-section-settings")).toBe(true);
    });

    test("the paginator starts hidden under infinite scroll", async() => {
      await setup({ preferences: { favorites: { infiniteScroll: true } } });

      expect(document.documentElement.dataset.paginationHidden).toBeDefined();
    });

    test("the drawer opens to the chosen section", async() => {
      const context = await setup();

      context.preferences.favorites.drawerOpen.set(true);
      context.preferences.favorites.drawerActiveSection.set("help");
      expect(document.getElementById(FavoritesId.root)?.dataset.drawerOpen).toBeDefined();
      expect(isHidden("favorites-drawer-section-help")).toBe(false);
      expect(isHidden("favorites-drawer-section-settings")).toBe(true);
    });

    test("the host page's header starts as its preference says", async() => {
      const hostPage = new MemoryHostPage(true);

      await setup({ hostPage, preferences: { favorites: { headerEnabled: false } } });
      expect(hostPage.headerVisible).toBe(false);
    });

    test("the host page's header follows its preference", async() => {
      const hostPage = new MemoryHostPage(true);
      const context = await setup({ hostPage });

      context.preferences.favorites.headerEnabled.set(false);
      expect(hostPage.headerVisible).toBe(false);
      context.preferences.favorites.headerEnabled.set(true);
      expect(hostPage.headerVisible).toBe(true);
    });

    test("follows the layout preference", async() => {
      const context = await setup();

      context.preferences.favorites.layout.set("row");
      expect(context.featureBridge.favorites.layout.request()).toBe("row");
    });
  });

  describe("input", () => {
    test.each<[string, SetupOptions, MouseEventInit]>([
      ["a middle-click", {}, { button: 1 }],
      ["a shift-click", {}, { button: 0, shiftKey: true }],
      ["without the gallery, a click", { features: ["favorites"] }, { button: 0 }]
    ])("on desktop, %s on a thumb opens its post", async(_, options, init) => {
      const navigator = new MemoryNavigator();
      const context = await setup({ ...options, navigator });

      dispatchMouse(context, "mousedown", queryImage(context, "2"), init);
      expect(navigator.opened).toEqual([context.ports.remotePages.postUrl("2")]);
    });

    test.each<[string, (context: AppContext) => Element, MouseEventInit]>([
      ["a click on a thumb, with the gallery", (context): Element => queryImage(context, "2"), { button: 0 }],
      ["a ctrl-middle-click on a thumb", (context): Element => queryImage(context, "2"), { button: 1, ctrlKey: true }],
      ["a middle-click outside any thumb", (context): Element => context.shell.content, { button: 1 }]
    ])("on desktop, %s opens no post", async(_, targetOf, init) => {
      const navigator = new MemoryNavigator();
      const context = await setup({ navigator });

      dispatchMouse(context, "mousedown", targetOf(context), init);
      expect(navigator.opened).toEqual([]);
    });

    test("on desktop, clicking a thumb keeps the page from following its link", async() => {
      const context = await setup();

      expect(dispatchMouse(context, "click", queryImage(context, "2"))).toBe(false);
    });

    test("on desktop, a ctrl-click on a thumb opens its media", async() => {
      const navigator = new MemoryNavigator();
      const context = await setup({ navigator });

      dispatchMouse(context, "click", queryImage(context, "2"), { ctrlKey: true });
      await vi.waitFor(() => expect(navigator.opened).toEqual(["data:text/plain,2"]));
    });

    test("with touch, a middle-click on a thumb does nothing", async() => {
      const navigator = new MemoryNavigator();
      const context = await setup({ navigator, environment: { pointer: "touch" } });

      dispatchMouse(context, "mousedown", queryImage(context, "2"), { button: 1 });
      expect(navigator.opened).toEqual([]);
    });

    test.each<[string, Partial<Environment>]>([
      ["hover", {}],
      ["touch", { pointer: "touch" }]
    ])("with %s, clicking a thumb's heart favorites it", async(_, environment) => {
      const remote = createRemote();

      remote.removeFavorite("2");
      const context = await setup({ remote, environment: { ownsFavorites: false, ...environment } });

      dispatchMouse(context, "click", queryHeart(context, "2"));
      await vi.waitFor(() => expect(hasFavorite(context, "2")).toBe(true));
      expect(readRemoteFavoriteIds(remote)).toContain("2");
    });

    test("on their own favorites page, clicking a thumb's heart unfavorites and forgets it", async() => {
      const remote = createRemote();
      const context = await setup({ remote });

      dispatchMouse(context, "click", queryHeart(context, "2"));
      await vi.waitFor(() => expect(hasFavorite(context, "2")).toBe(false));
      await vi.waitFor(async() => expect(await createFruitModel(context).loadFavoriteIds()).toHaveLength(2));
      expect(readRemoteFavoriteIds(remote)).not.toContain("2");
    });

    test("on their own favorites page, clicking a thumb's heart before favorites finish loading changes nothing and keeps showing the sync", async() => {
      const remote = createRemote();
      const context = await startFavoritesMidLoad({ remote });

      dispatchMouse(context, "click", queryHeart(context, "2"));
      await Promise.resolve();

      expect(hasFavorite(context, "2")).toBe(true);
      expect(readRemoteFavoriteIds(remote)).toContain("2");
      expect(readStatus()).toBe("Syncing with Rule34");
    });

    test("on someone else's favorites page, clicking a thumb's heart works before favorites finish loading", async() => {
      const remote = createRemote();

      remote.removeFavorite("2");
      const context = await startFavoritesMidLoad({ remote, environment: { ownsFavorites: false } });

      dispatchMouse(context, "click", queryHeart(context, "2"));
      await vi.waitFor(() => expect(hasFavorite(context, "2")).toBe(true));
      expect(readRemoteFavoriteIds(remote)).toContain("2");
    });

    test("with touch, a swipe that ends on a thumb's heart does not favorite it", async() => {
      const context = await setup({ environment: { ownsFavorites: false, pointer: "touch" } });

      vi.spyOn(context.domEvents, "didSwipe").mockReturnValue(true);
      dispatchMouse(context, "click", queryHeart(context, "2"));
      expect(hasFavorite(context, "2")).toBe(false);
    });

    test("without the gallery, hovering a thumb takes its link away", async() => {
      const context = await setup({ features: ["favorites"] });
      const link = queryImage(context, "2").closest("a") as HTMLAnchorElement;

      expect(link.getAttribute("href")).toBe(context.ports.remotePages.postUrl("2"));
      dispatchMouse(context, "mouseover", queryImage(context, "2"));
      expect(link.getAttribute("href")).toBeNull();
    });
  });

  describe("on a post list page", () => {
    test("only serves the local favorite ids, without touching the page", async() => {
      const context = createContext({ environment: { mode: "postList" } }, false);

      await store(context);
      startFavorites(context);
      expect((await context.featureBridge.favorites.favoriteIds.request()).sort()).toEqual(["1", "2", "3"]);
      expect(context.featureBridge.favorites.searchResults.request()).toEqual([]);
    });
  });

});
