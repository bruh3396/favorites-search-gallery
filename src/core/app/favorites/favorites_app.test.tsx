import { DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT, FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { FavoritesApp, FavoritesAppClass } from "@/core/app/favorites/favorites_app";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import APP_CSS from "@/core/app/favorites/favorites_app.css?inline";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TabStripClass } from "@/core/ui/components/tabs/tab_strip";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  elements: HTMLElement[];
  element: HTMLElement;
  lightboxView: HTMLElement;
  loadState: Signal<FavoritesLoadState>;
  zenEnabled: Signal<boolean>;
  favoritesWorkspace: FavoritesWorkspace;
  tabStripVisible: StoredValue<boolean>;
}

function createWorkspace(): FavoritesWorkspace {
  const favoritesPaginationPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.pagination;
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  return new FavoritesWorkspace({
    favoritesWorkspaceSnapshot: new KeyedStoredValue(
      { key: "workspace", defaultValue: DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT },
      { storedValueStorage: new MemoryLocalKeyedValues() }
    ),
    createSession: (favoritesSearchSettings): FavoritesSession => new FavoritesSession({ favoritesSearchSettings }, {
      favoritesSearchIndex,
      favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
      favoritesPaginationPreferences,
      randomSource: new MemoryRandomSource()
    })
  });
}

function setup(): Setup {
  const loadState = new Signal<FavoritesLoadState>({ phase: "fetching", loadedCount: 150, expectedCount: 600 });
  const loadStatus: Readable<string> = new Signal("");
  const lightboxView = document.createElement("dialog");
  const zenEnabled = new Signal(false);
  const favoritesPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites;
  const favoritesWorkspace = createWorkspace();
  const { result: elements } = render(document, () => h(FavoritesApp, {
    favoritesService: { loadState, loadStatus },
    favoritesWorkspace,
    lightboxView,
    favoritesPreferences,
    zenEnabled,
    renderTool: () => document.createElement("form"),
    renderPanel: () => document.createElement("section")
  }));
  return { elements, element: elements[0], lightboxView, loadState, zenEnabled, favoritesWorkspace, tabStripVisible: favoritesPreferences.tabStripVisible };
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

  test("opens, closes, and closes all tabs from the tab strip", () => {
    const { element } = setup();
    const countTabs = (): number => element.querySelectorAll("[role=tab]").length;
    const click = (selector: string): void => element.querySelector<HTMLButtonElement>(selector)!.click();

    click(`.${TabStripClass.add}`);
    click(`.${TabStripClass.add}`);
    const opened = countTabs();

    click(`.${TabStripClass.close}`);
    const afterClose = countTabs();

    click(`.${TabStripClass.closeAll}`);
    expect([opened, afterClose, countTabs()]).toEqual([3, 2, 1]);
  });

  test("hides and shows the tab strip as the preference says, keeping the shown panel", () => {
    const { element, tabStripVisible } = setup();
    const isStripHidden = (): boolean => element.querySelector("[role=tablist]")!.closest("[hidden]") !== null;
    const panel = element.querySelector(`.${FavoritesAppClass.panes} section`);

    tabStripVisible.set(false);
    const wasHidden = isStripHidden();

    tabStripVisible.set(true);
    expect([wasHidden, isStripHidden(), element.querySelector(`.${FavoritesAppClass.panes} section`)]).toEqual([true, false, panel]);
  });

  test("activates a clicked tab and moves a tab dropped on another", () => {
    const { element, favoritesWorkspace } = setup();
    const { tabManager } = favoritesWorkspace;

    element.querySelector<HTMLButtonElement>(`.${TabStripClass.add}`)!.click();
    const [firstTabId, secondTabId] = tabManager.tabs.value.map(tab => tab.id);
    const [firstTab] = [...element.querySelectorAll<HTMLElement>(`.${TabStripClass.tab}`)];
    const dataTransfer = new DataTransfer();
    const drop = new MouseEvent("drop", { bubbles: true, cancelable: true, clientX: 0 });

    firstTab.querySelector<HTMLButtonElement>("[role=tab]")!.click();
    dataTransfer.setData("application/x-fsg-tab", secondTabId);
    Object.defineProperty(drop, "dataTransfer", { value: dataTransfer });
    firstTab.getBoundingClientRect = (): DOMRect => ({ left: 0, width: 100 }) as DOMRect;
    firstTab.dispatchEvent(drop);
    expect([tabManager.activeTabId.value, tabManager.tabs.value.map(tab => tab.id)]).toEqual([firstTabId, [secondTabId, firstTabId]]);
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
    const hint = element.querySelector<HTMLElement>(`.${FavoritesAppClass.zenHint}`)!;

    expect(hint.hidden).toBe(true);
    zenEnabled.value = true;
    expect([hint.hidden, hint.textContent]).toEqual([false, "Press Z or Esc to exit Zen"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesAppClass, APP_CSS);
  });
});
