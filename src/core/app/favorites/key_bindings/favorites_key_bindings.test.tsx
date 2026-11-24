import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { EmptyStateClass } from "@/core/ui/components/empty_state/empty_state";
import { FavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings";
import { FavoritesKeyBindingsRow } from "@/core/app/favorites/key_bindings/favorites_key_bindings_row";
import { FavoritesKeyBindingsSection } from "@/core/app/favorites/key_bindings/favorites_key_bindings_section";
import { KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { Signal } from "@/core/utils/reactive/signal";
import { readKeyBindingListItemText } from "@/testing/key_binding_list_item_text_reader";

function createRow(
  label: string,
  keys: readonly string[] = [],
  partialFavoritesKeyBindingsRow: Partial<FavoritesKeyBindingsRow> = {}
): FavoritesKeyBindingsRow {
  return { label, keys: new Signal(keys), findKeyOwnerLabel: () => undefined, onKeyChange: vi.fn(), onKeyRemove: vi.fn(), ...partialFavoritesKeyBindingsRow };
}

function createSections(): FavoritesKeyBindingsSection[] {
  return [
    { title: "Search", rows: [createRow("Focus Search Bar", ["/"]), createRow("Toggle Search Options")] },
    { title: "Navigation", rows: [createRow("Go to Next Page", ["ArrowRight"]), createRow("Increase Page Size")] },
    { title: "View", rows: [createRow("Increase Tile Size"), createRow("Toggle Zen", ["z"])] }
  ];
}

function setup(favoritesKeyBindingsSections: readonly FavoritesKeyBindingsSection[] = createSections(), resetKeyBindings = vi.fn()): HTMLElement {
  return render(document, () => <FavoritesKeyBindings sections={favoritesKeyBindingsSections} resetKeyBindings={resetKeyBindings} />).result;
}

function readShownItems(pane: HTMLElement): string[] {
  return [...pane.querySelectorAll<HTMLElement>(`.${KeyBindingListItemClass.root}`)]
    .filter(item => item.closest("[hidden]") === null)
    .map(readKeyBindingListItemText);
}

function readShownHeadings(pane: HTMLElement): string[] {
  return [...pane.querySelectorAll<HTMLElement>("h3")]
    .filter(heading => heading.closest("[hidden]") === null)
    .map(heading => heading.textContent);
}

function readShownEmptyStateMessage(pane: HTMLElement): string | null {
  const message = pane.querySelector<HTMLElement>(`.${EmptyStateClass.message}`)!;
  return message.closest("[hidden]") === null ? message.textContent : null;
}

function readTabsHidden(pane: HTMLElement): boolean {
  return pane.querySelector("[role=tablist]")!.closest("[hidden]") !== null;
}

function clickTab(pane: HTMLElement, label: string): void {
  [...pane.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(tab => tab.textContent === label)!.click();
}

function searchShortcuts(pane: HTMLElement, searchText: string): void {
  const input = pane.querySelector<HTMLInputElement>("input[aria-label=\"Search Keyboard Shortcuts\"]")!;

  input.value = searchText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("FavoritesKeyBindings", () => {
  test("shows one tab per section, starting on the first", () => {
    const pane = setup();

    expect([[...pane.querySelectorAll("[role=tab]")].map(tab => tab.textContent), readShownItems(pane)])
      .toEqual([["Search", "Navigation", "View"], ["Focus Search Bar/", "Toggle Search Options"]]);
  });

  test("shows only the picked section's rows", () => {
    const pane = setup();

    clickTab(pane, "View");
    expect(readShownItems(pane)).toEqual(["Increase Tile Size", "Toggle ZenZ"]);
  });

  test("follows a row's changed keys", () => {
    const keys = new Signal<readonly string[]>([]);
    const pane = setup([{ title: "View", rows: [createRow("Toggle Zen", [], { keys })] }]);

    keys.value = ["g"];
    expect(readShownItems(pane)).toEqual(["Toggle ZenG"]);
  });

  test("asks for a reset when its reset button is clicked", () => {
    const resetKeyBindings = vi.fn();

    setup(createSections(), resetKeyBindings).querySelector<HTMLButtonElement>("button[aria-label=\"Reset Keyboard Shortcuts\"]")!.click();
    expect(resetKeyBindings).toHaveBeenCalledOnce();
  });

  test("shows matches from every section under their headings, hiding the tabs", () => {
    const pane = setup();

    searchShortcuts(pane, "size");
    expect([readShownHeadings(pane), readShownItems(pane), readTabsHidden(pane)])
      .toEqual([["Navigation", "View"], ["Increase Page Size", "Increase Tile Size"], true]);
  });

  test("matches only rows holding every searched word, in any order and any case", () => {
    const pane = setup();

    searchShortcuts(pane, "size TILE increase");
    expect(readShownItems(pane)).toEqual(["Increase Tile Size"]);
  });

  test("matches section titles and keys as shown", () => {
    const pane = setup();

    searchShortcuts(pane, "navigation →");
    expect(readShownItems(pane)).toEqual(["Go to Next Page→"]);
  });

  test("names the search text when nothing matches", () => {
    const pane = setup();
    const initialEmptyStateMessage = readShownEmptyStateMessage(pane);

    searchShortcuts(pane, " nothing ");
    expect([initialEmptyStateMessage, readShownEmptyStateMessage(pane), readShownItems(pane)])
      .toEqual([null, "No keyboard shortcuts match \"nothing\"", []]);
  });

  test("returns to the picked section without headings once the search is cleared", () => {
    const pane = setup();

    clickTab(pane, "Navigation");
    searchShortcuts(pane, "zen");
    searchShortcuts(pane, " ");
    expect([readShownHeadings(pane), readShownItems(pane), readTabsHidden(pane)])
      .toEqual([[], ["Go to Next Page→", "Increase Page Size"], false]);
  });

  test("reports a changed key to its row", () => {
    const onKeyChange = vi.fn();
    const pane = setup([{ title: "Search", rows: [createRow("Toggle Search Options", ["c", "x"], { onKeyChange })] }]);

    document.body.append(pane);
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change X\"]")!.click();
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "q", bubbles: true, cancelable: true }));
    pane.remove();
    expect(onKeyChange).toHaveBeenCalledWith(1, "q");
  });

  test("reports a removed key to its row", () => {
    const onKeyRemove = vi.fn();
    const pane = setup([{ title: "Search", rows: [createRow("Toggle Search Options", ["c", "x"], { onKeyRemove })] }]);

    document.body.append(pane);
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change X\"]")!.click();
    [...pane.querySelectorAll("button")].find(button => button.textContent === "Remove")!.click();
    pane.remove();
    expect(onKeyRemove).toHaveBeenCalledWith(1);
  });
});
