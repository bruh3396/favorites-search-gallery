import { Signal, computed } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { LIGHTBOX_COMMAND_LABELS } from "@/core/features/lightbox/commands/lightbox_command_labels";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { MemoryConfirmer } from "@/adapters/memory/ports/confirmer/memory_confirmer";
import { composeFavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings_composer";
import { createKeyBindings } from "@/testing/key_bindings";
import { render } from "@/core/ui/h/h";

interface Setup {
  pane: HTMLElement;
  confirmer: MemoryConfirmer;
}

function setup(
  initialKeyBindingOverrides: KeyBindingOverrides<FavoritesCommand>,
  initialLightboxKeyBindingOverrides: KeyBindingOverrides<LightboxCommand> = {}
): Setup {
  const keyBindingOverrides = new Signal(initialKeyBindingOverrides);
  const lightboxKeyBindingOverrides = new Signal(initialLightboxKeyBindingOverrides);
  const confirmer = new MemoryConfirmer();
  const favoritesCommands = Object.keys(FAVORITES_COMMAND_LABELS) as FavoritesCommand[];
  const lightboxCommands = Object.keys(LIGHTBOX_COMMAND_LABELS) as LightboxCommand[];
  const pane = render(document, () => composeFavoritesKeyBindings({
    keyBindings: computed(() => createKeyBindings(favoritesCommands, keyBindingOverrides.value)),
    keyBindingOverrides: {
      peek: () => keyBindingOverrides.peek(),
      set: (value): void => {
        keyBindingOverrides.value = value;
      }
    },
    lightboxKeyBindings: computed(() => createKeyBindings(lightboxCommands, lightboxKeyBindingOverrides.value)),
    lightboxKeyBindingOverrides: {
      peek: () => lightboxKeyBindingOverrides.peek(),
      set: (value): void => {
        lightboxKeyBindingOverrides.value = value;
      }
    },
    confirmer
  })).result;
  return { pane, confirmer };
}

function clickTab(pane: HTMLElement, label: string): void {
  [...pane.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(tab => tab.textContent === label)!.click();
}

function clickResetShortcuts(pane: HTMLElement): void {
  pane.querySelector<HTMLButtonElement>("button[aria-label=\"Reset All Keyboard Shortcuts\"]")!.click();
}

function readShownItems(pane: HTMLElement): string[] {
  return [...pane.querySelectorAll<HTMLElement>(`.${KeyBindingListItemClass.root}`)]
    .filter(item => item.closest("[hidden]") === null)
    .map(item => item.textContent);
}

function searchShortcuts(pane: HTMLElement, searchText: string): void {
  const input = pane.querySelector<HTMLInputElement>("input[aria-label=\"Search Keyboard Shortcuts\"]")!;

  input.value = searchText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("composeFavoritesKeyBindings", () => {
  test("lists the favorites sections, then the gallery's", () => {
    const { pane } = setup({});

    expect([...pane.querySelectorAll("[role=tab]")].map(tab => tab.textContent)).toEqual(["Search", "Navigation", "View", "Gallery"]);
  });

  test("shows the gallery's commands with their keys under Gallery", () => {
    const { pane } = setup({}, { showNext: ["ArrowRight", "d"] });

    clickTab(pane, "Gallery");
    expect(readShownItems(pane).slice(0, 2)).toEqual(["Show Next→D", "Show Previous–"]);
  });

  test("matches the gallery's commands by their labels", () => {
    const { pane } = setup({});

    searchShortcuts(pane, "zoom");
    expect(readShownItems(pane)).toEqual(["Toggle Zoom–"]);
  });

  test("checks a gallery key only against the gallery's commands", () => {
    const { pane } = setup({ toggleZen: ["x"] }, { showNext: ["n"], toggleZoom: ["z"] });

    document.body.append(pane);
    clickTab(pane, "Gallery");
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change N\"]")!.click();
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true, cancelable: true }));
    const conflictText = readShownItems(pane)[0];

    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true, cancelable: true }));
    pane.remove();
    expect([conflictText, readShownItems(pane)[0]]).toEqual(["Show NextZZ is used by Toggle ZoomOverwriteCancel", "Show NextX"]);
  });

  test("clears every override, the gallery's too, once the reset is confirmed", () => {
    const { pane, confirmer } = setup({ focusSearch: ["/"] }, { showNext: ["n"] });

    clickResetShortcuts(pane);
    const firstItem = readShownItems(pane)[0];

    clickTab(pane, "Gallery");
    expect([confirmer.questions.length, firstItem, readShownItems(pane)[0]]).toEqual([1, "Focus Search Bar–", "Show Next–"]);
  });

  test("saves a gallery key pressed in place of a clicked one, taking it from the gallery command that had it", () => {
    const { pane } = setup({}, { showNext: ["n"], toggleZoom: ["z"] });

    document.body.append(pane);
    clickTab(pane, "Gallery");
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change N\"]")!.click();
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true, cancelable: true }));
    [...pane.querySelectorAll("button")].find(button => button.textContent === "Overwrite")!.click();
    pane.remove();
    expect(readShownItems(pane).filter(item => (/^(?:Show Next|Toggle Zoom)/u).test(item))).toEqual(["Show NextZ", "Toggle Zoom–"]);
  });

  test("saves a removed gallery key", () => {
    const { pane } = setup({}, { showNext: ["n", "d"] });

    document.body.append(pane);
    clickTab(pane, "Gallery");
    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Change N\"]")!.click();
    [...pane.querySelectorAll("button")].find(button => button.textContent === "Remove")!.click();
    pane.remove();
    expect(readShownItems(pane)[0]).toBe("Show NextD");
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
