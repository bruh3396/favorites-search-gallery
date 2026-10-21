import { FavoritesShell, FavoritesShellClass } from "@/core/app/favorites_page/shell/shell";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LoadState } from "@/core/features/favorites/load/state";
import SHELL_CSS from "@/core/app/favorites_page/shell/shell.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(): { element: HTMLElement; loadState: Signal<LoadState>; pane: HTMLElement; banner: HTMLElement } {
  const loadState = new Signal<LoadState>({ phase: "fetching", loadedCount: 150, expectedCount: 600 });
  const pane = document.createElement("section");
  const { result: element } = render(document, () => <FavoritesShell favorites={{ loadState }} panes={[pane]} />);
  const banner = element.querySelector<HTMLElement>(`.${FavoritesShellClass.banner}`)!;
  return { element, loadState, pane, banner };
}

describe("FavoritesShell", () => {
  test("shows the panes it is given", () => {
    const { element, pane } = setup();

    expect(element.contains(pane)).toBe(true);
  });

  test("shows the load's step in the banner while loading", () => {
    const { banner } = setup();

    expect([banner.hidden, banner.querySelector("[role=status]")!.textContent]).toEqual([false, "Fetching favorites: 150 / 600"]);
  });

  test("shows the load's progress until it finishes", () => {
    const { element, loadState } = setup();
    const progressBar = element.querySelector<HTMLElement>("[role=progressbar]")!;

    expect([progressBar.hidden, progressBar.getAttribute("aria-valuenow")]).toEqual([false, "25"]);
    loadState.value = { phase: "loaded", pulledCount: 0, removedCount: 0 };
    expect(progressBar.hidden).toBe(true);
  });

  test("hides the banner once loaded", () => {
    const { loadState, banner } = setup();

    loadState.value = { phase: "loaded", pulledCount: 3, removedCount: 1 };
    expect(banner.hidden).toBe(true);
  });

  test("keeps the banner when the load is interrupted", () => {
    const { loadState, banner } = setup();

    loadState.value = { phase: "interrupted" };
    expect([banner.hidden, banner.textContent]).toEqual([false, "Couldn't finish loading favorites"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesShellClass, SHELL_CSS);
  });
});
