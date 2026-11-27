import { Mock, describe, expect, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { CountBadgeClass } from "@/core/ui/components/count_badge/count_badge";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { Tab } from "@/core/ui/components/tabs/tab";
import { composeFavoritesActivityBar } from "@/core/app/favorites/activity_bar/favorites_activity_bar_composer";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { render } from "@/core/ui/h/h";

interface Setup {
  element: HTMLElement;
  favoritesTabStripVisible: StoredValue<boolean>;
  tabs: Signal<readonly Tab<unknown>[]>;
  keyBindings: Signal<Pick<KeyBindings<FavoritesCommand>, "toggleTabs" | "toggleZen">>;
  enterZen: Mock<() => void>;
}

function createTabs(tabCount: number): Tab<unknown>[] {
  return Array.from({ length: tabCount }, (_, index) => ({ id: `tab-${index}`, value: null, closable: true }));
}

function setup(): Setup {
  const localKeyedValues = new MemoryLocalKeyedValues();
  const { favorites: favoritesPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, localKeyedValues, ["favorites"]);
  const { favoritesTabStripVisible } = createStoredTree(APP_STORAGE_SCHEMA.state, localKeyedValues, ["favoritesTabStripVisible"]);
  const tabs = new Signal<readonly Tab<unknown>[]>(createTabs(1));
  const keyBindings = new Signal<Pick<KeyBindings<FavoritesCommand>, "toggleTabs" | "toggleZen">>({ toggleTabs: ["t"], toggleZen: ["z"] });
  const enterZen = vi.fn<() => void>();
  const { result: element } = render(document, () => composeFavoritesActivityBar({ scriptVersion: "2.0.0" }, {
    favoritesPreferences, favoritesTabStripVisible, tabManager: { tabs }, keyBindings, enterZen,
    renderViewByTool: {
      settings: () => document.createElement("section"),
      keyBindings: () => document.createElement("section"),
      snippets: () => document.createElement("section")
    }
  }));
  return { element, favoritesTabStripVisible, tabs, keyBindings, enterZen };
}

function findButton(element: HTMLElement, label: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}

describe("composeFavoritesActivityBar", () => {
  test("toggles the tab strip from Tabs", () => {
    const { element, favoritesTabStripVisible } = setup();
    const wasVisible = favoritesTabStripVisible.value;

    findButton(element, "Tabs").click();
    expect([wasVisible, favoritesTabStripVisible.value]).toEqual([true, false]);
  });

  test("counts the open tabs on Tabs only while the strip hides more than one", () => {
    const { element, favoritesTabStripVisible, tabs } = setup();
    const badge = findButton(element, "Tabs").querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;
    const readBadge = (): [boolean, string] => [badge.hidden, badge.textContent!];

    tabs.value = createTabs(3);
    const shown = readBadge();

    favoritesTabStripVisible.set(false);
    const hidden = readBadge();

    tabs.value = createTabs(1);
    expect([shown, hidden, readBadge()]).toEqual([[true, "0"], [false, "3"], [true, "0"]]);
  });

  test("enters zen from Zen", () => {
    const { element, enterZen } = setup();

    findButton(element, "Zen").click();
    expect(enterZen).toHaveBeenCalledOnce();
  });

  test("names the bound keys in the Tabs and Zen tooltips, following rebinding", () => {
    const { element, keyBindings } = setup();
    const readTitles = (): string[] => [findButton(element, "Tabs").title, findButton(element, "Zen").title];
    const bound = readTitles();

    keyBindings.value = { toggleTabs: ["b"], toggleZen: [] };
    expect([bound, readTitles()]).toEqual([["Tabs (T)", "Zen (Z)"], ["Tabs (B)", "Zen"]]);
  });
});
