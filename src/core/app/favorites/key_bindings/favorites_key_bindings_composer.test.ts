import { KeyBindingOverrides, applyKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { MemoryConfirmer } from "@/adapters/memory/ports/confirmer/memory_confirmer";
import { composeFavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings_composer";
import { render } from "@/core/ui/h/h";

interface Setup {
  pane: HTMLElement;
  keyBindingOverrides: Signal<KeyBindingOverrides<FavoritesCommand>>;
  confirmer: MemoryConfirmer;
}

const UNBOUND_KEY_BINDINGS = Object.fromEntries(Object.keys(FAVORITES_COMMAND_LABELS).map(favoritesCommand => [favoritesCommand, []])) as
  unknown as KeyBindings<FavoritesCommand>;

function setup(initialKeyBindingOverrides: KeyBindingOverrides<FavoritesCommand> = {}): Setup {
  const keyBindingOverrides = new Signal(initialKeyBindingOverrides);
  const confirmer = new MemoryConfirmer();
  const pane = render(document, () => composeFavoritesKeyBindings({
    keyBindings: computed(() => applyKeyBindingOverrides(UNBOUND_KEY_BINDINGS, keyBindingOverrides.value)),
    keyBindingOverrides: {
      set: (value): void => {
        keyBindingOverrides.value = value;
      }
    },
    confirmer
  })).result;
  return { pane, keyBindingOverrides, confirmer };
}

function clickResetShortcuts(pane: HTMLElement): void {
  pane.querySelector<HTMLButtonElement>("button[aria-label=\"Reset All Shortcuts\"]")!.click();
}

function readShownItems(pane: HTMLElement): string[] {
  return [...pane.querySelectorAll<HTMLElement>(`.${KeyBindingListItemClass.root}`)]
    .filter(item => item.closest("[hidden]") === null)
    .map(item => item.textContent);
}

function clickTab(pane: HTMLElement, label: string): void {
  [...pane.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(tab => tab.textContent === label)!.click();
}

describe("composeFavoritesKeyBindings", () => {
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
    const { pane, keyBindingOverrides } = setup();

    clickTab(pane, "Misc");
    keyBindingOverrides.value = { toggleZen: ["z"] };
    expect(readShownItems(pane)[0]).toBe("Toggle ZenZ");
  });

  test("clears every override once the reset is confirmed", () => {
    const { pane, confirmer } = setup({ focusSearch: ["/"] });

    clickResetShortcuts(pane);
    expect([confirmer.questions.length, readShownItems(pane)[0]]).toEqual([1, "Focus Search Bar–"]);
  });

  test("keeps the overrides when the reset is declined", () => {
    const { pane, confirmer } = setup({ focusSearch: ["/"] });

    confirmer.answer = false;
    clickResetShortcuts(pane);
    expect(readShownItems(pane)[0]).toBe("Focus Search Bar/");
  });
});
