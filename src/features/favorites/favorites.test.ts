/* eslint-disable no-spaced-func, func-call-spacing -- false positive: arrow function types inside test.each's generic confuse these rules */
import { RatingBit, RatingMask } from "@/types/search";
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
  { id: "1", tags: "apple", score: 5, rating: "safe" },
  { id: "2", tags: "banana", score: 30, rating: "explicit" },
  { id: "3", tags: "apple cherry", score: 10, rating: "questionable" }
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
  return [...context.shell.content.querySelectorAll<HTMLElement>(".post")].map(thumb => thumb.id);
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

interface MouseDispatch extends MouseEventInit {
  type: "click" | "mousedown" | "mouseover";
}

function dispatchMouse(context: AppContext, target: Element, { type, ...init }: MouseDispatch): boolean {
  target.addEventListener(type, event => context.domEvents.document[type].emit(new EnhancedMouseEvent(event as MouseEvent)), { once: true });
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

  test("saves an archive of the search results when download is clicked", async() => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fruits");

    vi.spyOn(URL, "revokeObjectURL").mockReturnValue();
    await setup();
    (document.querySelector("[data-downloader-action]") as HTMLElement).click();
    await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob)));
  });

  test("appends a snippet's query to the search when the snippet is used", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("searchSnippets", [createSnippet("fruits", "apple")]);
    await setup({ localKeyedValues });
    (document.querySelector("[data-snippet-name=fruits]") as HTMLElement).click();
    expect(querySearchBox().value).toBe("apple");
  });

  test("finds the search results with a snippet query built from them", async() => {
    const context = await setup();

    context.events.favorites.searchRequested.emit("apple");
    (document.querySelector("[data-snippet-action=fillQueryFromResults]") as HTMLElement).click();
    context.events.favorites.searchRequested.emit("");
    context.events.favorites.searchRequested.emit((document.querySelector(".favorites-snippets-query-field") as HTMLTextAreaElement).value);
    expect(readSortedThumbIds(context)).toEqual(["1", "3"]);
  });

  test.each<[string, (context: AppContext) => void, string[]]>([
    ["searches on a search request", (context): void => context.events.favorites.searchRequested.emit("apple"), ["1", "3"]],
    [
      "searches what's typed when the search button is clicked", (context): void => {
        querySearchBox().value = "banana";
        context.events.favorites.searchButtonClicked.emit(new MouseEvent("click"));
      }, ["2"]
    ],
    [
      "shows what the search left out when the invert button is clicked", (context): void => {
        context.events.favorites.searchRequested.emit("apple");
        context.events.favorites.invertButtonClicked.emit(new MouseEvent("click"));
      }, ["2"]
    ],
    ["searches for a tag from the overlay's tag search", (context): void => context.events.postOverlay.searchForTagRequested.emit("banana"), ["2"]]
  ])("%s", async(_, trigger, ids) => {
    const context = await setup();

    trigger(context);
    expect(readSortedThumbIds(context)).toEqual(ids);
  });

  test("reorders the same favorites when the shuffle button is clicked", async() => {
    const context = await setup();
    const before = readThumbOrder(context);

    context.events.favorites.shuffleButtonClicked.emit(new MouseEvent("click"));
    expect(readThumbOrder(context)).not.toEqual(before);
    expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
  });

  test.each<[string, (context: AppContext) => void, string]>([
    [
      "empties the search box when the clear button is clicked", (context): void => {
        querySearchBox().value = "apple";
        context.events.favorites.clearButtonClicked.emit(new MouseEvent("click"));
      }, ""
    ],
    ["appends a tag the overlay adds to the search", (context): void => context.events.postOverlay.addTagToSearchRequested.emit("cherry"), "cherry"],
    [
      "appends a tag the overlay excludes to the search, negated",
      (context): void => context.events.postOverlay.excludeTagFromSearchRequested.emit("cherry"),
      "-cherry"
    ]
  ])("%s", async(_, trigger, value) => {
    const context = await setup();

    trigger(context);
    expect(querySearchBox().value).toBe(value);
  });

  test("opens the post list on a post list request", async() => {
    const navigator = new MemoryNavigator();
    const context = await setup({ navigator });

    context.events.favorites.postListRequested.emit("apple");
    expect(navigator.opened).toEqual(["#search-apple"]);
  });

  test.each<[string, (context: AppContext) => void]>([
    ["selecting a page", (context): void => context.events.favorites.pageSelected.emit(2)],
    ["stepping forward", (context): void => context.events.favorites.pageStepped.emit("ArrowRight")],
    ["submitting a page", (context): void => context.events.favorites.gotoPageSubmitted.emit(2)],
    ["another feature advancing the page", (context): boolean => context.featureBridge.favorites.advance.request("ArrowRight")]
  ])("shows the second page after %s", async(_, trigger) => {
    const context = await setup({ preferences: { favorites: { resultsPerPage: 1 } } });

    trigger(context);
    expect(readThumbOrder(context)).toEqual([context.featureBridge.favorites.searchResults.request()[1].id]);
  });

  test("opens the go-to-page prompt when toggled and closes it on submit", async() => {
    const context = await setup({ preferences: { favorites: { resultsPerPage: 1 } } });

    context.events.favorites.gotoPageToggled.emit();
    expect(isGotoPagePopoverOpen()).toBe(true);
    context.events.favorites.gotoPageSubmitted.emit(2);
    expect(isGotoPagePopoverOpen()).toBe(false);
  });

  test("marks an added favorite on its thumb", async() => {
    const context = await setup({ environment: { ownsFavorites: false } });

    context.events.app.favoriteAdded.emit("2");
    expect(hasFavorite(context, "2")).toBe(true);
  });

  test("unmarks and forgets a removed favorite", async() => {
    const context = await setup();

    context.events.app.favoriteRemoved.emit("2");
    expect(hasFavorite(context, "2")).toBe(false);
    await vi.waitFor(async() => expect(await createFruitModel(context).loadFavoriteIds()).toHaveLength(2));
  });

  test("asks before resetting settings", async() => {
    const confirm = vi.fn(() => false);

    vi.stubGlobal("confirm", confirm);
    const context = await setup();

    context.events.favorites.settingsResetRequested.emit();
    expect(confirm).toHaveBeenCalledWith("Reset all settings?");
  });

  test("forgets saved settings and reloads once a settings reset is confirmed", async() => {
    vi.stubGlobal("confirm", () => true);
    const reload = vi.spyOn(window.location, "reload").mockReturnValue();
    const context = await setup();
    const resetPreferences = vi.spyOn(context.preferences, "reset");

    context.events.favorites.settingsResetRequested.emit();
    expect(resetPreferences).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  test.each<[string, (context: AppContext) => void, string[]]>([
    ["filters the results by allowed rating", (context): void => context.preferences.favorites.allowedRatings.set(RatingBit.Explicit as RatingMask), ["2"]],
    ["hides blacklisted favorites while the blacklist is excluded", (context): void => context.preferences.favorites.excludeBlacklist.set(true), ["1", "3"]]
  ])("%s", async(_, change, ids) => {
    const context = await setup({ environment: { blacklistedTags: "banana" } });

    change(context);
    expect(readSortedThumbIds(context)).toEqual(ids);
  });

  test("orders the results by the sort key", async() => {
    const context = await setup();

    context.preferences.favorites.sortKey.set("score");
    expect(readThumbOrder(context)).toEqual(["2", "3", "1"]);
  });

  test("reverses the results with the sort direction", async() => {
    const context = await setup();
    const before = readThumbOrder(context);

    context.preferences.favorites.sortAscending.set(true);
    expect(readThumbOrder(context)).toEqual([...before].reverse());
  });

  test("limits the shown favorites to the results per page", async() => {
    const context = await setup();

    context.preferences.favorites.resultsPerPage.set(1);
    expect(readThumbOrder(context)).toHaveLength(1);
  });

  test("replaces the paginator with infinite scroll", async() => {
    const context = await setup();

    context.preferences.favorites.infiniteScroll.set(true);
    expect(document.documentElement.dataset.paginationHidden).toBeDefined();
    expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
  });

  test("brings the paginator back when infinite scroll turns off", async() => {
    const context = await setup({ preferences: { favorites: { infiniteScroll: true } } });

    context.preferences.favorites.infiniteScroll.set(false);
    expect(document.documentElement.dataset.paginationHidden).toBeUndefined();
    expect(readSortedThumbIds(context)).toEqual(["1", "2", "3"]);
  });

  test("starts the drawer as its preferences say", async() => {
    await setup({ preferences: { favorites: { drawerOpen: true, drawerActiveSection: "help" } } });

    expect(document.getElementById(FavoritesId.root)?.dataset.drawerOpen).toBeDefined();
    expect(isHidden("favorites-drawer-section-help")).toBe(false);
    expect(isHidden("favorites-drawer-section-settings")).toBe(true);
  });

  test("starts the paginator hidden under infinite scroll", async() => {
    await setup({ preferences: { favorites: { infiniteScroll: true } } });

    expect(document.documentElement.dataset.paginationHidden).toBeDefined();
  });

  test("opens the drawer to the chosen section", async() => {
    const context = await setup();

    context.preferences.favorites.drawerOpen.set(true);
    context.preferences.favorites.drawerActiveSection.set("help");
    expect(document.getElementById(FavoritesId.root)?.dataset.drawerOpen).toBeDefined();
    expect(isHidden("favorites-drawer-section-help")).toBe(false);
    expect(isHidden("favorites-drawer-section-settings")).toBe(true);
  });

  test("starts the host page's header as its preference says", async() => {
    const hostPage = new MemoryHostPage(true);

    await setup({ hostPage, preferences: { favorites: { headerEnabled: false } } });
    expect(hostPage.headerVisible).toBe(false);
  });

  test("makes the host page's header follow its preference", async() => {
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

  test.each<[string, SetupOptions, MouseEventInit]>([
    ["a middle-click", {}, { button: 1 }],
    ["a shift-click", {}, { button: 0, shiftKey: true }],
    ["a click without the gallery", { features: ["favorites"] }, { button: 0 }]
  ])("opens a thumb's post on %s on desktop", async(_, options, init) => {
    const navigator = new MemoryNavigator();
    const context = await setup({ ...options, navigator });

    dispatchMouse(context, queryImage(context, "2"), { type: "mousedown", ...init });
    expect(navigator.opened).toEqual([context.ports.remotePages.postUrl("2")]);
  });

  test.each<[string, (context: AppContext) => Element, MouseEventInit]>([
    ["a click on a thumb, with the gallery", (context): Element => queryImage(context, "2"), { button: 0 }],
    ["a ctrl-middle-click on a thumb", (context): Element => queryImage(context, "2"), { button: 1, ctrlKey: true }],
    ["a middle-click outside any thumb", (context): Element => context.shell.content, { button: 1 }]
  ])("opens no post on %s on desktop", async(_, selectTarget, init) => {
    const navigator = new MemoryNavigator();
    const context = await setup({ navigator });

    dispatchMouse(context, selectTarget(context), { type: "mousedown", ...init });
    expect(navigator.opened).toEqual([]);
  });

  test("keeps the page from following a thumb's link on a desktop click", async() => {
    const context = await setup();

    expect(dispatchMouse(context, queryImage(context, "2"), { type: "click" })).toBe(false);
  });

  test("opens a thumb's media on a desktop ctrl-click", async() => {
    const navigator = new MemoryNavigator();
    const context = await setup({ navigator });

    dispatchMouse(context, queryImage(context, "2"), { type: "click", ctrlKey: true });
    await vi.waitFor(() => expect(navigator.opened).toEqual(["data:text/plain,2"]));
  });

  test("ignores a touch middle-click on a thumb", async() => {
    const navigator = new MemoryNavigator();
    const context = await setup({ navigator, environment: { pointer: "touch" } });

    dispatchMouse(context, queryImage(context, "2"), { type: "mousedown", button: 1 });
    expect(navigator.opened).toEqual([]);
  });

  test.each<[string, Partial<Environment>]>([
    ["hover", {}],
    ["touch", { pointer: "touch" }]
  ])("favorites a thumb when its heart is clicked with %s", async(_, environment) => {
    const remote = createRemote();

    remote.removeFavorite("2");
    const context = await setup({ remote, environment: { ownsFavorites: false, ...environment } });

    dispatchMouse(context, queryHeart(context, "2"), { type: "click" });
    await vi.waitFor(() => expect(hasFavorite(context, "2")).toBe(true));
    expect(readRemoteFavoriteIds(remote)).toContain("2");
  });

  test("unfavorites and forgets a thumb whose heart is clicked on the user's own favorites page", async() => {
    const remote = createRemote();
    const context = await setup({ remote });

    dispatchMouse(context, queryHeart(context, "2"), { type: "click" });
    await vi.waitFor(() => expect(hasFavorite(context, "2")).toBe(false));
    await vi.waitFor(async() => expect(await createFruitModel(context).loadFavoriteIds()).toHaveLength(2));
    expect(readRemoteFavoriteIds(remote)).not.toContain("2");
  });

  test("ignores a heart click on the user's own favorites page until favorites load, and keeps showing the sync", async() => {
    const remote = createRemote();
    const context = await startFavoritesMidLoad({ remote });

    dispatchMouse(context, queryHeart(context, "2"), { type: "click" });
    await Promise.resolve();

    expect(hasFavorite(context, "2")).toBe(true);
    expect(readRemoteFavoriteIds(remote)).toContain("2");
    expect(readStatus()).toBe("Syncing with Rule34");
  });

  test("favorites a thumb whose heart is clicked on someone else's favorites page before favorites finish loading", async() => {
    const remote = createRemote();

    remote.removeFavorite("2");
    const context = await startFavoritesMidLoad({ remote, environment: { ownsFavorites: false } });

    dispatchMouse(context, queryHeart(context, "2"), { type: "click" });
    await vi.waitFor(() => expect(hasFavorite(context, "2")).toBe(true));
    expect(readRemoteFavoriteIds(remote)).toContain("2");
  });

  test("ignores a touch swipe that ends on a thumb's heart", async() => {
    const context = await setup({ environment: { ownsFavorites: false, pointer: "touch" } });

    vi.spyOn(context.domEvents, "didSwipe").mockReturnValue(true);
    dispatchMouse(context, queryHeart(context, "2"), { type: "click" });
    expect(hasFavorite(context, "2")).toBe(false);
  });

  test("takes a hovered thumb's link away without the gallery", async() => {
    const context = await setup({ features: ["favorites"] });
    const link = queryImage(context, "2").closest("a") as HTMLAnchorElement;

    expect(link.getAttribute("href")).toBe(context.ports.remotePages.postUrl("2"));
    dispatchMouse(context, queryImage(context, "2"), { type: "mouseover" });
    expect(link.getAttribute("href")).toBeNull();
  });

  test("only serves the local favorite ids on a post list page, without touching the page", async() => {
    const context = createContext({ environment: { mode: "postList" } }, false);

    await store(context);
    startFavorites(context);
    expect((await context.featureBridge.favorites.favoriteIds.request()).sort()).toEqual(["1", "2", "3"]);
    expect(context.featureBridge.favorites.searchResults.request()).toEqual([]);
  });

});
