import { FavoritesShell, FavoritesShellClass } from "@/core/app/favorites/shell/shell";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import SHELL_CSS from "@/core/app/favorites/shell/shell.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(): { element: HTMLElement; loadState: Signal<FavoritesLoadState>; pane: HTMLElement; zenEnabled: Signal<boolean> } {
  const loadState = new Signal<FavoritesLoadState>({ phase: "fetching", loadedCount: 150, expectedCount: 600 });
  const pane = document.createElement("section");
  const zenEnabled = new Signal(false);
  const { result: element } = render(document, () => <FavoritesShell favorites={{ loadState }} panes={[pane]} zenEnabled={zenEnabled} />);
  return { element, loadState, pane, zenEnabled };
}

describe("FavoritesShell", () => {
  test("shows the panes it is given", () => {
    const { element, pane } = setup();

    expect(element.contains(pane)).toBe(true);
  });

  test("shows the load's progress until it finishes", () => {
    const { element, loadState } = setup();
    const progressBar = element.querySelector<HTMLElement>("[role=progressbar]")!;

    expect([progressBar.hidden, progressBar.getAttribute("aria-valuenow")]).toEqual([false, "25"]);
    loadState.value = { phase: "loaded", pulledCount: 0, removedCount: 0 };
    expect(progressBar.hidden).toBe(true);
  });

  test("becomes a zen root while zen is enabled", () => {
    const { element, zenEnabled } = setup();

    expect(element.hasAttribute("data-zen")).toBe(false);
    zenEnabled.value = true;
    expect(element.hasAttribute("data-zen")).toBe(true);
  });

  test("shows how to exit zen only while zen is enabled", () => {
    const { element, zenEnabled } = setup();
    const hint = element.querySelector<HTMLElement>("[role=status]")!;

    expect(hint.hidden).toBe(true);
    zenEnabled.value = true;
    expect([hint.hidden, hint.textContent]).toEqual([false, "Press Z or Esc to exit zen"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesShellClass, SHELL_CSS);
  });
});
