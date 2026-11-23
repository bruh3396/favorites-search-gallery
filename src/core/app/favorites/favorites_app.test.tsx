import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { FavoritesApp, FavoritesAppClass } from "@/core/app/favorites/favorites_app";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import APP_CSS from "@/core/app/favorites/favorites_app.css?inline";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { Signal } from "@/core/utils/reactive/signal";
import { StringInterner } from "@/core/utils/string/string_interner";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  elements: HTMLElement[];
  element: HTMLElement;
  lightboxView: HTMLElement;
  tabsHeader: HTMLElement;
  loadState: Signal<FavoritesLoadState>;
  zenEnabled: Signal<boolean>;
  zenExitKeys: Signal<readonly string[]>;
}

function createWorkspace(): FavoritesWorkspace {
  const favoritesPaginationPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.pagination;
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  return new FavoritesWorkspace({
    favoritesWorkspaceSnapshot: new KeyedStoredValue(
      { key: "workspace", defaultValue: DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT },
      { storedValueStorage: new MemoryLocalKeyedValues() }
    ),
    createSession: (favoritesSearchOptions): FavoritesSession => new FavoritesSession({ favoritesSearchOptions }, {
      favoritesSearchIndex,
      favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
      favoritesPaginationPreferences,
      randomSource: new MemoryRandomSource()
    }),
    randomSource: new MemoryRandomSource()
  });
}

function setup(): Setup {
  const loadState = new Signal<FavoritesLoadState>({ phase: "fetching", loadedCount: 150, expectedCount: 600 });
  const lightboxView = document.createElement("dialog");
  const tabsHeader = document.createElement("nav");
  const zenEnabled = new Signal(false);
  const zenExitKeys = new Signal<readonly string[]>(["z", "Escape"]);
  const { result: elements } = render(document, () => h(FavoritesApp, {
    favoritesService: { loadState },
    favoritesWorkspace: createWorkspace(),
    lightboxView,
    activityBar: document.createElement("aside"),
    tabsHeaderChild: tabsHeader,
    zenEnabled,
    zenExitKeys,
    renderPanel: () => document.createElement("section")
  }));
  return { elements, element: elements[0], lightboxView, tabsHeader, loadState, zenEnabled, zenExitKeys };
}

function readZenHint(element: HTMLElement): HTMLElement {
  return element.querySelector<HTMLElement>(`.${FavoritesAppClass.zenHint}`)!;
}

describe("FavoritesApp", () => {
  test("places the lightbox beside the app", () => {
    const { elements, element, lightboxView } = setup();

    expect(elements).toEqual([element, lightboxView]);
  });

  test("shows the tab panels it renders", () => {
    const { element } = setup();

    expect(element.querySelector(`.${FavoritesAppClass.panes} section`)).not.toBe(null);
  });

  test("shows its tabs header content", () => {
    const { element, tabsHeader } = setup();

    expect(element.contains(tabsHeader)).toBe(true);
  });

  test("shows the load's progress until it finishes", () => {
    const { element, loadState } = setup();
    const progressBar = element.querySelector<HTMLElement>("[role=progressbar]")!;

    expect([progressBar.hidden, progressBar.getAttribute("aria-valuenow")]).toEqual([false, "25"]);
    loadState.value = { phase: "loaded", newCount: 0, unfavoritedCount: 0 };
    expect(progressBar.hidden).toBe(true);
  });

  test("becomes a zen root while zen is enabled", () => {
    const { element, zenEnabled } = setup();

    expect(element.hasAttribute("data-zen")).toBe(false);
    zenEnabled.value = true;
    expect(element.hasAttribute("data-zen")).toBe(true);
  });

  test("shows how to exit Zen only while zen is enabled", () => {
    const { element, zenEnabled } = setup();
    const hint = readZenHint(element);

    expect(hint.hidden).toBe(true);
    zenEnabled.value = true;
    expect([hint.hidden, hint.textContent]).toEqual([false, "Press Z or Esc to exit Zen"]);
  });

  test("names a single Zen exit key alone", () => {
    const { element, zenEnabled, zenExitKeys } = setup();

    zenEnabled.value = true;
    zenExitKeys.value = ["x"];
    expect(readZenHint(element).textContent).toBe("Press X to exit Zen");
  });

  test("lists many Zen exit keys with the last after or", () => {
    const { element, zenEnabled, zenExitKeys } = setup();

    zenEnabled.value = true;
    zenExitKeys.value = ["z", "x", "Escape"];
    expect(readZenHint(element).textContent).toBe("Press Z, X or Esc to exit Zen");
  });

  test("hides the Zen hint while no key exits Zen", () => {
    const { element, zenEnabled, zenExitKeys } = setup();

    zenEnabled.value = true;
    zenExitKeys.value = [];
    expect(readZenHint(element).hidden).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesAppClass, APP_CSS);
  });
});
