import { Signal, computed } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { MemoryConfirmer } from "@/adapters/memory/ports/confirmer/memory_confirmer";
import { composeFavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings_composer";
import { createKeyBindings } from "@/testing/key_bindings";
import { render } from "@/core/ui/h/h";

interface Setup {
  pane: HTMLElement;
  confirmer: MemoryConfirmer;
}

function setup(initialKeyBindingOverrides: KeyBindingOverrides<FavoritesCommand>): Setup {
  const keyBindingOverrides = new Signal(initialKeyBindingOverrides);
  const confirmer = new MemoryConfirmer();
  const favoritesCommands = Object.keys(FAVORITES_COMMAND_LABELS) as FavoritesCommand[];
  const pane = render(document, () => composeFavoritesKeyBindings({
    keyBindings: computed(() => createKeyBindings(favoritesCommands, keyBindingOverrides.value)),
    keyBindingOverrides: {
      peek: () => keyBindingOverrides.peek(),
      set: (value): void => {
        keyBindingOverrides.value = value;
      }
    },
    confirmer
  })).result;
  return { pane, confirmer };
}

function clickResetShortcuts(pane: HTMLElement): void {
  pane.querySelector<HTMLButtonElement>("button[aria-label=\"Reset All Keyboard Shortcuts\"]")!.click();
}

function readShownItems(pane: HTMLElement): string[] {
  return [...pane.querySelectorAll<HTMLElement>(`.${KeyBindingListItemClass.root}`)]
    .filter(item => item.closest("[hidden]") === null)
    .map(item => item.textContent);
}

describe("composeFavoritesKeyBindings", () => {
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

  test("saves a key pressed in place of a clicked one", () => {
    const { pane } = setup({ focusSearch: ["/"], toggleSearchOptions: ["c"] });

    document.body.append(pane);
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change /\"]")!.click();
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "F", bubbles: true, cancelable: true }));
    expect(readShownItems(pane)[0]).toBe("Focus Search BarF");
    pane.remove();
  });

  test("names the command that has a pressed key, and moves the key to the clicked one on Overwrite", () => {
    const { pane } = setup({ focusSearch: ["/"], toggleSearchOptions: ["c"] });

    document.body.append(pane);
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change /\"]")!.click();
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true, cancelable: true }));
    const conflictText = readShownItems(pane)[0];

    [...pane.querySelectorAll("button")].find(button => button.textContent === "Overwrite")!.click();
    pane.remove();
    expect([conflictText, ...readShownItems(pane).slice(0, 2)])
      .toEqual(["Focus Search BarCC is used by Toggle Search OptionsOverwriteCancel", "Focus Search BarC", "Toggle Search Options–"]);
  });

  test("saves a removed key", () => {
    const { pane } = setup({ focusSearch: ["/", "s"] });

    document.body.append(pane);
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change /\"]")!.click();
    [...pane.querySelectorAll("button")].find(button => button.textContent === "Remove")!.click();
    expect(readShownItems(pane)[0]).toBe("Focus Search BarS");
    pane.remove();
  });
});
