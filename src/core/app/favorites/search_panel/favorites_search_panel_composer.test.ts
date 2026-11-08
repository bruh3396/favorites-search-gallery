import { DEFAULT_SEARCH_HISTORY_CONFIGURATION, SearchHistory } from "@/core/utils/collection/search_history";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { CountBadgeClass } from "@/core/ui/components/count_badge/count_badge";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/memory_navigator";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Signal } from "@/core/utils/reactive/signal";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton_grid";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TileClass } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { composeFavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel_composer";
import { createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { createPost } from "@/testing/post";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { render } from "@/core/ui/h/h";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  favoritesSession: FavoritesSession;
  watched: Set<Element>;
  openLightbox: Mock<(favorite: Favorite) => boolean>;
  enterZen: Mock<() => void>;
  navigator: MemoryNavigator;
  searchHistory: SearchHistory;
  favoritesTabStripVisible: StoredValue<boolean>;
  tabCount: Signal<number>;
}

function setup(posts: Post[] = [], { userOwnsFavorites = true }: { userOwnsFavorites?: boolean } = {}): Setup {
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const favoritesPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites;
  const { favoritesTabStripVisible, favoritesSearchSettingsVisible } = createStoredTree(
    APP_STORAGE_SCHEMA.state,
    new MemoryLocalKeyedValues(),
    ["favoritesTabStripVisible", "favoritesSearchSettingsVisible"]
  );
  const watched = new Set<Element>();
  const visibilityObserver: VisibilityObserver = {
    observe: element => {
      watched.add(element);
      return (): void => {
        watched.delete(element);
      };
    }
  };
  const openLightbox = vi.fn<(favorite: Favorite) => boolean>(() => true);
  const enterZen = vi.fn<() => void>();
  const navigator = new MemoryNavigator();
  const tabCount = new Signal(1);
  const searchHistory = new SearchHistory(DEFAULT_SEARCH_HISTORY_CONFIGURATION, {
    submittedQueries: new KeyedStoredValue<readonly string[]>(
      { key: "submittedQueries", defaultValue: [] },
      { storedValueStorage: new MemoryLocalKeyedValues() }
    )
  });

  favoritesPreferences.pagination.pageSize.set(2);
  favoritesSearchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  const favoritesSession = new FavoritesSession({ favoritesSearchSettings: buildFavoritesSearchSettings() }, {
    favoritesSearchIndex,
    favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    favoritesPaginationPreferences: favoritesPreferences.pagination
  });

  favoritesSession.start();
  const scheduler = new MemoryScheduler();
  const { result: element, dispose } = render(document, () => composeFavoritesSearchPanel(createFavoritesTab(favoritesSession), { userOwnsFavorites }, {
    favoritesService: {
      loadState: new Signal<FavoritesLoadState>({ phase: "starting" }),
      searchable: new Milestone(),
      hydrated: new Emitter<Favorite>(),
      getTagsStartingWith: prefix => favoritesSearchIndex.getTagsStartingWith(prefix),
      countFavoritesWithTag: tag => favoritesSearchIndex.countFavoritesWithTag(tag)
    },
    favoritesPreferences,
    favoritesTabStripVisible,
    favoritesSearchSettingsVisible,
    tabCount,
    searchHistory,
    favoriteSizeRecorder: { sizes: [] },
    visibilityObserver,
    sizeObserver: new MemorySizeObserver(),
    imageLoaderService: createImageLoaderService({ scheduler }),
    remotePages: new MemoryRemotePages(new MemoryClient([])),
    navigator,
    openLightbox,
    postActions: { openOriginal: vi.fn() },
    enterZen
  }));
  return { element, dispose, favoritesSession, watched, openLightbox, enterZen, navigator, searchHistory, favoritesTabStripVisible, tabCount };
}

function queryTileLinks(element: HTMLElement): HTMLAnchorElement[] {
  return [...element.querySelectorAll<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)];
}

function readShownPostUrls(element: HTMLElement): string[] {
  return queryTileLinks(element).map(link => {
    link.dispatchEvent(new Event("pointerdown"));
    return link.getAttribute("href")!;
  });
}

describe("composeFavoritesSearchPanel", () => {
  test("links each favorite's tile to its post's page", () => {
    const { element } = setup([createPost({ id: "1" })]);

    expect(readShownPostUrls(element)).toEqual(["#post-1"]);
  });

  test("shapes each favorite's tile after its post's size", () => {
    const { element } = setup([createPost({ id: "1", width: 300, height: 200 })]);
    const tile = queryTileLinks(element)[0].closest<HTMLElement>(`.${TileClass.root}`)!;

    expect(tile.style.getPropertyValue("--fsg-Tile-aspect-ratio")).toBe("300 / 200");
  });

  test("shows only the tab's current page in the grid", () => {
    const { element, favoritesSession } = setup([createPost({ id: "1" }), createPost({ id: "2" }), createPost({ id: "3" })]);
    const firstPage = readShownPostUrls(element);

    favoritesSession.goTo(2);
    expect([firstPage, readShownPostUrls(element)]).toEqual([["#post-1", "#post-2"], ["#post-3"]]);
  });

  test("opens the clicked favorite in the lightbox", () => {
    const { element, openLightbox } = setup([createPost({ id: "1" })]);

    queryTileLinks(element)[0].click();
    expect(openLightbox.mock.calls.map(([favorite]) => favorite.id)).toEqual(["1"]);
  });

  test("suggests metatags for the word in the search box", () => {
    const { element } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    textarea.value = "sc";
    textarea.dispatchEvent(new Event("input"));
    expect([...element.querySelectorAll("[role=option]")].map(option => option.textContent)).toEqual(["score:>", "score:<", "score:"]);
  });

  test("suggests the favorites' tags after the metatags, most used first", () => {
    const { element } = setup([createPost({ id: "1", tags: "scarf sc_tag" }), createPost({ id: "2", tags: "sc_tag" })]);
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    textarea.value = "sc";
    textarea.dispatchEvent(new Event("input"));
    expect([...element.querySelectorAll("[role=option]")].map(option => option.textContent)).toEqual(["score:>", "score:<", "score:", "sc_tag2", "scarf1"]);
  });

  test("offers what follows a suggestion accepted with Tab", () => {
    const { element } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: (_command: string, _showUi: unknown, text: string): boolean => {
        textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, "end");
        textarea.dispatchEvent(new Event("input"));
        return true;
      }
    });
    onTestFinished(() => {
      Reflect.deleteProperty(document, "execCommand");
    });
    textarea.value = "cat sc";
    textarea.dispatchEvent(new Event("input"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", cancelable: true }));
    expect([textarea.value, element.querySelectorAll("[role=option]").length]).toEqual(["cat score:>", 0]);
  });

  test("points the search box at the highlighted suggestion", () => {
    const { element } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    document.body.append(element);
    onTestFinished(() => element.remove());
    textarea.value = "sc";
    textarea.dispatchEvent(new Event("input"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
    expect(textarea.ariaActiveDescendantElement).toBe(element.querySelector("[role=option]"));
  });

  test("opens the typed query on the site when Search is right-clicked", () => {
    const { element, navigator } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    textarea.value = "cat dog";
    element.querySelector("button[type=submit]")!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    expect(navigator.opened).toEqual(["#search-cat%20dog"]);
  });

  test("searches the tab and remembers each submitted query, newest first", () => {
    const { element, favoritesSession, searchHistory } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    for (const query of ["cat", "dog"]) {
      textarea.value = query;
      textarea.form!.dispatchEvent(new Event("submit"));
    }
    expect([favoritesSession.query.value, searchHistory.submittedQueries.value]).toEqual(["dog", ["dog", "cat"]]);
  });

  test("opens and closes the search settings row from the funnel", () => {
    const { element } = setup();
    const row = element.querySelector<HTMLElement>("[role=group][aria-label=Filters]")!;
    const funnel = element.querySelector<HTMLButtonElement>("button[aria-label=Filters]")!;
    const isRowHidden = (): boolean => row.closest("[hidden]") !== null;

    expect(isRowHidden()).toBe(true);
    funnel.click();
    expect(isRowHidden()).toBe(false);
    funnel.click();
    expect(isRowHidden()).toBe(true);
  });

  test("searches the tab from the search settings row and counts the change on the funnel", () => {
    const { element, favoritesSession } = setup();
    const funnel = element.querySelector<HTMLButtonElement>("button[aria-label=Filters]")!;
    const invert = [...element.querySelectorAll("button")].find(button => button.textContent === "Invert")!;

    invert.click();
    expect([favoritesSession.searchSettings.value.isInverted, funnel.getAttribute("aria-label")]).toEqual([true, "Filters, 1 Changed"]);
  });

  test("counts the changed search settings on the funnel only while there are some, shown or not", () => {
    const { element, favoritesSession } = setup();
    const funnel = element.querySelector<HTMLButtonElement>("button[aria-label^=Filters]")!;
    const badge = funnel.querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;
    const readBadge = (): [boolean, string] => [badge.hidden, badge.textContent!];
    const unchanged = readBadge();

    favoritesSession.invert();
    favoritesSession.updateSearchSettings({ sortKey: "score" });
    const changed = readBadge();

    funnel.click();
    expect([unchanged, changed, readBadge()]).toEqual([[true, "0"], [false, "2"], [false, "2"]]);
  });

  test("leaves Blacklist out of the search settings row on someone else's favorites", () => {
    const hasBlacklist = (element: HTMLElement): boolean => [...element.querySelectorAll("button")].some(button => button.textContent === "Blacklist");

    expect([hasBlacklist(setup().element), hasBlacklist(setup([], { userOwnsFavorites: false }).element)]).toEqual([true, false]);
  });

  test("toggles the tab strip from the Tabs button and reports it as pressed while shown", () => {
    const { element, favoritesTabStripVisible } = setup();
    const tabsButton = element.querySelector<HTMLButtonElement>("button[aria-label^=Tabs]")!;
    const readState = (): [boolean, string | null] => [favoritesTabStripVisible.value, tabsButton.getAttribute("aria-pressed")];
    const before = readState();

    tabsButton.click();
    const hidden = readState();

    tabsButton.click();
    expect([before, hidden, readState()]).toEqual([[true, "true"], [false, "false"], [true, "true"]]);
  });

  test("counts the open tabs on the Tabs button only while the strip hides more than one", () => {
    const { element, favoritesTabStripVisible, tabCount } = setup();
    const tabsButton = element.querySelector<HTMLButtonElement>("button[aria-label^=Tabs]")!;
    const badge = tabsButton.querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;
    const readBadge = (): [boolean, string, string | null] => [badge.hidden, badge.textContent!, tabsButton.getAttribute("aria-label")];

    tabCount.value = 3;
    const shown = readBadge();

    favoritesTabStripVisible.set(false);
    const hidden = readBadge();

    tabCount.value = 1;
    expect([shown, hidden, readBadge()]).toEqual([
      [true, "0", "Tabs"],
      [false, "3", "Tabs, 3 Open"],
      [true, "0", "Tabs"]
    ]);
  });

  test("enters zen from the zen button", () => {
    const { element, enterZen } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label=\"Enter Zen\"]")!.click();
    expect(enterZen).toHaveBeenCalledOnce();
  });

  test("stops watching its tiles once disposed", () => {
    const { element, dispose, watched } = setup([createPost({ id: "1" })]);
    const tiles = [...element.querySelectorAll(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.root}`)];
    const countWatched = (): number => tiles.filter(tile => watched.has(tile)).length;
    const before = countWatched();

    dispose();
    expect([before, countWatched()]).toEqual([1, 0]);
  });
});
