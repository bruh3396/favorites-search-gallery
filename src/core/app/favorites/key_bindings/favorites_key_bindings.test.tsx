import { FavoritesKeyBindings, FavoritesKeyBindingsClass } from "@/core/app/favorites/key_bindings/favorites_key_bindings";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { EmptyStateClass } from "@/core/ui/components/empty_state/empty_state";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import FAVORITES_KEY_BINDINGS_CSS from "@/core/app/favorites/key_bindings/favorites_key_bindings.css?inline";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { Signal } from "@/core/utils/reactive/signal";
import { createKeyBindings } from "@/testing/key_bindings";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  pane: HTMLElement;
  keyBindings: Signal<KeyBindings<FavoritesCommand>>;
}

const FAVORITES_COMMANDS = Object.keys(FAVORITES_COMMAND_LABELS) as FavoritesCommand[];

function setup(keyBindingOverrides: KeyBindingOverrides<FavoritesCommand> = {}, resetKeyBindings = vi.fn()): Setup {
  const keyBindings = new Signal(createKeyBindings(FAVORITES_COMMANDS, keyBindingOverrides));
  const pane = render(document, () => <FavoritesKeyBindings keyBindings={keyBindings} resetKeyBindings={resetKeyBindings} />).result;
  return { pane, keyBindings };
}

function readShownItems(pane: HTMLElement): string[] {
  return [...pane.querySelectorAll<HTMLElement>(`.${KeyBindingListItemClass.root}`)]
    .filter(item => item.closest("[hidden]") === null)
    .map(item => item.textContent);
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
  const input = pane.querySelector<HTMLInputElement>("input[aria-label=\"Search Shortcuts\"]")!;

  input.value = searchText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("FavoritesKeyBindings", () => {
  test("shows one tab per section, starting on Search", () => {
    const { pane } = setup();

    expect([...pane.querySelectorAll("[role=tab]")].map(tab => tab.textContent)).toEqual(["Search", "Browse", "Grid", "Gallery", "Misc"]);
    expect(readShownItems(pane).slice(0, 2)).toEqual(["Focus Search Bar–", "Clear Search–"]);
  });

  test("shows only the picked section's commands with their keys, labeled", () => {
    const { pane } = setup({ goToNextPage: ["ArrowRight", "d"] });

    clickTab(pane, "Grid");
    const gridItems = readShownItems(pane);

    clickTab(pane, "Browse");
    expect(gridItems).toEqual(["Increase Tile Size–", "Decrease Tile Size–", "Cycle Layout–", "Toggle HD–"]);
    expect(readShownItems(pane)[0]).toBe("Go to Next Page→D");
  });

  test("follows changed key bindings", () => {
    const { pane, keyBindings } = setup();

    clickTab(pane, "Misc");
    keyBindings.value = createKeyBindings(FAVORITES_COMMANDS, { toggleZen: ["z"] });
    expect(readShownItems(pane)[0]).toBe("Toggle ZenZ");
  });

  test("asks for a reset when its reset button is clicked", () => {
    const resetKeyBindings = vi.fn();

    setup({}, resetKeyBindings).pane.querySelector<HTMLButtonElement>("button[aria-label=\"Reset All Shortcuts\"]")!.click();
    expect(resetKeyBindings).toHaveBeenCalledOnce();
  });

  test("shows matches from every section under their headings, hiding the tabs", () => {
    const { pane } = setup();

    searchShortcuts(pane, "size");
    expect([readShownHeadings(pane), readShownItems(pane), readTabsHidden(pane)]).toEqual([
      ["Browse", "Grid"],
      ["Increase Page Size–", "Decrease Page Size–", "Increase Tile Size–", "Decrease Tile Size–"],
      true
    ]);
  });

  test("matches only commands holding every searched word, in any order and any case", () => {
    const { pane } = setup();

    searchShortcuts(pane, "size TILE increase");
    expect(readShownItems(pane)).toEqual(["Increase Tile Size–"]);
  });

  test("matches section titles and keys as shown", () => {
    const { pane } = setup({ goToNextPage: ["ArrowRight"] });

    searchShortcuts(pane, "browse →");
    expect(readShownItems(pane)).toEqual(["Go to Next Page→"]);
  });

  test("names the search text when nothing matches", () => {
    const { pane } = setup();
    const initialEmptyStateMessage = readShownEmptyStateMessage(pane);

    searchShortcuts(pane, " nothing ");
    expect([initialEmptyStateMessage, readShownEmptyStateMessage(pane), readShownItems(pane)])
      .toEqual([null, "No shortcuts match \"nothing\"", []]);
  });

  test("returns to the picked section without headings once the search is cleared", () => {
    const { pane } = setup();

    clickTab(pane, "Grid");
    searchShortcuts(pane, "zen");
    searchShortcuts(pane, " ");
    expect([readShownHeadings(pane), readShownItems(pane), readTabsHidden(pane)]).toEqual([
      [],
      ["Increase Tile Size–", "Decrease Tile Size–", "Cycle Layout–", "Toggle HD–"],
      false
    ]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesKeyBindingsClass, FAVORITES_KEY_BINDINGS_CSS);
  });
});
