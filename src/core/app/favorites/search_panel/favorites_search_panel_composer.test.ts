import { DEFAULT_SEARCH_HISTORY_CONFIGURATION, SearchHistory } from "@/core/utils/collection/search_history";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { CountBadgeClass } from "@/core/ui/components/count_badge/count_badge";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
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
import { Snippet } from "@/core/domain/snippet/snippet";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TileClass } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { buildFavoritesSearchOptions } from "@/core/features/favorites/testing/favorites_search_options_builder";
import { composeFavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel_composer";
import { createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { createPost } from "@/testing/post";
import { createSnippet } from "@/testing/snippet";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { render } from "@/core/ui/h/h";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  favoritesSession: FavoritesSession;
  watched: Set<Element>;
  openLightbox: Mock<(favorite: Favorite) => boolean>;
  navigator: MemoryNavigator;
  searchHistory: SearchHistory;
  keyBindings: Signal<Pick<KeyBindings<FavoritesCommand>, "toggleSearchOptions">>;
}

function setup(posts: Post[] = [], { userOwnsFavorites = true, snippets = [] }: { userOwnsFavorites?: boolean; snippets?: Snippet[] } = {}): Setup {
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const favoritesPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites;
  const { favoritesSearchOptionsVisible } = createStoredTree(APP_STORAGE_SCHEMA.state, new MemoryLocalKeyedValues(), ["favoritesSearchOptionsVisible"]);
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
  const navigator = new MemoryNavigator();
  const searchHistory = new SearchHistory(DEFAULT_SEARCH_HISTORY_CONFIGURATION, {
    submittedQueries: new KeyedStoredValue<readonly string[]>(
      { key: "submittedQueries", defaultValue: [] },
      { storedValueStorage: new MemoryLocalKeyedValues() }
    )
  });

  favoritesPreferences.pagination.pageSize.set(2);
  favoritesSearchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  const favoritesSession = new FavoritesSession({ favoritesSearchOptions: buildFavoritesSearchOptions() }, {
    favoritesSearchIndex,
    favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    favoritesPaginationPreferences: favoritesPreferences.pagination
  });

  favoritesSession.start();
  const scheduler = new MemoryScheduler();
  const keyBindings = new Signal<Pick<KeyBindings<FavoritesCommand>, "toggleSearchOptions">>({ toggleSearchOptions: ["o"] });
  const { result: element, dispose } = render(document, () => composeFavoritesSearchPanel(createFavoritesTab(favoritesSession), { userOwnsFavorites }, {
    favoritesService: {
      loadState: new Signal<FavoritesLoadState>({ phase: "starting" }),
      searchable: new Milestone(),
      hydrated: new Emitter<Favorite>(),
      getTagsStartingWith: prefix => favoritesSearchIndex.getTagsStartingWith(prefix),
      countFavoritesWithTag: tag => favoritesSearchIndex.countFavoritesWithTag(tag)
    },
    favoritesPreferences,
    favoritesSearchOptionsVisible,
    keyBindings,
    searchHistory,
    favoriteSizeRecorder: { sizes: [] },
    visibilityObserver,
    sizeObserver: new MemorySizeObserver(),
    imageLoaderService: createImageLoaderService({ scheduler }),
    remotePages: new MemoryRemotePages(new MemoryClient([])),
    navigator,
    openLightbox,
    postActions: { openOriginal: vi.fn() },
    snippetLibrary: { snippets: new Signal(snippets), recordUse: vi.fn(() => Promise.resolve()) }
  }));
  return { element, dispose, favoritesSession, watched, openLightbox, navigator, searchHistory, keyBindings };
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

  test("suggests snippets before the metatags", () => {
    const { element } = setup([], { snippets: [createSnippet({ name: "scenery", query: "landscape" })] });
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    textarea.value = "sc";
    textarea.dispatchEvent(new Event("input"));
    expect([...element.querySelectorAll("[role=option]")].map(option => option.textContent)).toEqual(["scenerylandscape", "score:>", "score:<", "score:"]);
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

  test("colors grouping operators in the search box by depth, leaving a stray ) and a top-level ~ plain", () => {
    const { element } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    textarea.value = "a ~ b ) ( c -( d ) ~ e )";
    textarea.dispatchEvent(new Event("input"));
    const coloredOperators = [...element.querySelectorAll<HTMLElement>("search div[aria-hidden=true] span")].map(span => [span.textContent, span.dataset.tone]);

    expect(coloredOperators).toEqual([["(", "0"], ["-(", "1"], [")", "1"], ["~", "0"], [")", "0"]]);
  });

  test("opens the typed query on the site when Search is right-clicked", () => {
    const { element, navigator } = setup();
    const textarea = element.querySelector<HTMLTextAreaElement>("search textarea")!;

    textarea.value = "cat dog";
    element.querySelector("button[type=submit]")!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    expect(navigator.opened).toEqual(["#search-cat%20dog"]);
  });

  test("opens the search syntax help from the suggestion list's footer", () => {
    const { element, navigator } = setup();
    const footerLink = [...element.querySelectorAll("button")].find(button => button.textContent === "Search Syntax")!;

    footerLink.click();
    expect(navigator.opened).toEqual(["https://github.com/bruh3396/favorites-search-gallery#search-syntax"]);
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

  test("opens and closes the search options row from the Search Options button", () => {
    const { element } = setup();
    const row = element.querySelector<HTMLElement>("[role=group][aria-label='Search Options']")!;
    const searchOptionsButton = element.querySelector<HTMLButtonElement>("button[aria-label='Search Options']")!;
    const isRowHidden = (): boolean => row.closest("[hidden]") !== null;

    expect(isRowHidden()).toBe(false);
    searchOptionsButton.click();
    expect(isRowHidden()).toBe(true);
    searchOptionsButton.click();
    expect(isRowHidden()).toBe(false);
  });

  test("names the Search Options key in its tooltip, following rebinding", () => {
    const { element, keyBindings } = setup();
    const searchOptionsButton = element.querySelector<HTMLButtonElement>("button[aria-label='Search Options']")!;
    const bound = searchOptionsButton.title;

    keyBindings.value = { toggleSearchOptions: [] };
    expect([bound, searchOptionsButton.title]).toEqual(["Search Options (O)", "Search Options"]);
  });

  test("searches the tab from the search options row", () => {
    const { element, favoritesSession } = setup();
    const invert = [...element.querySelectorAll("button")].find(button => button.textContent === "Invert")!;

    invert.click();
    expect(favoritesSession.searchOptions.value.isInverted).toBe(true);
  });

  test("counts the changed search options on the Search Options button only while there are some and the row is closed", () => {
    const { element, favoritesSession } = setup();
    const searchOptionsButton = element.querySelector<HTMLButtonElement>("button[aria-label^='Search Options']")!;
    const badge = searchOptionsButton.querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;
    const readBadge = (): [boolean, string] => [badge.hidden, badge.textContent!];

    searchOptionsButton.click();
    const unchanged = readBadge();

    favoritesSession.invert();
    favoritesSession.updateSearchOptions({ sortKey: "score" });
    const changed = readBadge();

    searchOptionsButton.click();
    expect([unchanged, changed, readBadge()]).toEqual([[true, "0"], [false, "2"], [true, "0"]]);
  });

  test("leaves Blacklist out of the search options row on someone else's favorites", () => {
    const hasBlacklist = (element: HTMLElement): boolean => [...element.querySelectorAll("button")].some(button => button.textContent === "Blacklist");

    expect([hasBlacklist(setup().element), hasBlacklist(setup([], { userOwnsFavorites: false }).element)]).toEqual([true, false]);
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
