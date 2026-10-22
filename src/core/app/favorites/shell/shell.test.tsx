import { FavoritesShell, FavoritesShellClass } from "@/core/app/favorites/shell/shell";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LoadState } from "@/core/features/favorites/load/state";
import SHELL_CSS from "@/core/app/favorites/shell/shell.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(): { element: HTMLElement; loadState: Signal<LoadState>; pane: HTMLElement } {
  const loadState = new Signal<LoadState>({ phase: "fetching", loadedCount: 150, expectedCount: 600 });
  const pane = document.createElement("section");
  const { result: element } = render(document, () => <FavoritesShell favorites={{ loadState }} panes={[pane]} />);
  return { element, loadState, pane };
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

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesShellClass, SHELL_CSS);
  });
});
