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
      set: (value): void => {
        keyBindingOverrides.value = value;
      }
    },
    confirmer
  })).result;
  return { pane, confirmer };
}

function clickResetShortcuts(pane: HTMLElement): void {
  pane.querySelector<HTMLButtonElement>("button[aria-label=\"Reset All Shortcuts\"]")!.click();
}

function readFirstShownItem(pane: HTMLElement): string {
  return [...pane.querySelectorAll<HTMLElement>(`.${KeyBindingListItemClass.root}`)]
    .find(item => item.closest("[hidden]") === null)!
    .textContent;
}

describe("composeFavoritesKeyBindings", () => {
  test("clears every override once the reset is confirmed", () => {
    const { pane, confirmer } = setup({ focusSearch: ["/"] });

    clickResetShortcuts(pane);
    expect([confirmer.questions.length, readFirstShownItem(pane)]).toEqual([1, "Focus Search Bar–"]);
  });

  test("keeps the overrides when the reset is declined", () => {
    const { pane, confirmer } = setup({ focusSearch: ["/"] });

    confirmer.answer = false;
    clickResetShortcuts(pane);
    expect(readFirstShownItem(pane)).toBe("Focus Search Bar/");
  });
});
