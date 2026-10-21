import { FavoritesShell, FavoritesShellClass } from "@/core/app/favorites_page/shell";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LoadState } from "@/core/features/favorites/load/state";
import SHELL_CSS from "@/core/app/favorites_page/shell.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(): { element: HTMLElement; loadState: Signal<LoadState>; resultCount: Signal<number>; pane: HTMLElement } {
  const loadState = new Signal<LoadState>({ phase: "fetching", loadedCount: 150, expectedCount: 600 });
  const resultCount = new Signal(150);
  const pane = document.createElement("section");
  const { result: element } = render(document, () => <FavoritesShell favorites={{ loadState }} resultCount={resultCount} panes={[pane]} />);
  return { element, loadState, resultCount, pane };
}

function readStatusBar(element: HTMLElement): string[] {
  return [...element.querySelector("footer")!.children].map(child => child.textContent ?? "");
}

describe("FavoritesShell", () => {
  test("shows the panes it is given", () => {
    const { element, pane } = setup();

    expect(element.contains(pane)).toBe(true);
  });

  test("shows the load's step and the results so far while loading", () => {
    const { element } = setup();

    expect(readStatusBar(element)).toEqual(["Fetching favorites: 150 / 600", "150 so far"]);
  });

  test("shows the load's progress until it finishes", () => {
    const { element, loadState } = setup();
    const progressBar = element.querySelector<HTMLElement>("[role=progressbar]")!;

    expect([progressBar.hidden, progressBar.getAttribute("aria-valuenow")]).toEqual([false, "25"]);
    loadState.value = { phase: "loaded", pulledCount: 0, removedCount: 0 };
    expect(progressBar.hidden).toBe(true);
  });

  test("shows what the load changed and the result count once loaded", () => {
    const { element, loadState, resultCount } = setup();

    loadState.value = { phase: "loaded", pulledCount: 3, removedCount: 1 };
    resultCount.value = 1_200;
    expect(readStatusBar(element)).toEqual(["3 new, 1 removed", `${(1_200).toLocaleString()} results`]);
  });

  test("counts a single result in the singular", () => {
    const { element, loadState, resultCount } = setup();

    loadState.value = { phase: "interrupted" };
    resultCount.value = 1;
    expect(readStatusBar(element)[1]).toBe("1 result");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesShellClass, SHELL_CSS);
  });
});
