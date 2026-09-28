import * as FavoritesToolbar from "@/features/favorites/control/toolbar/toolbar";
import { Events, createEvents } from "@/app/context/events";
import { describe, expect, test } from "vitest";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesToolbarSlots } from "@/types/favorites_ui";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createPreferences } from "@/testing/preferences";

type ButtonEvent = "search" | "reset" | "invert" | "scratch" | "shuffle";

interface Setup {
  slots: FavoritesToolbarSlots;
  preferences: Preferences;
  clicked: ButtonEvent[];
}

function setup(onDesktopDevice = true): Setup {
  const environment = createEnvironment({ device: onDesktopDevice ? "desktop" : "mobile" });
  const slots = new FavoritesShell(new Shell(environment), environment).toolbar;
  const preferences = createPreferences({ favorites: { drawerOpen: false } });
  const events = createEvents();
  const clicked = recordButtonEvents(events);

  FavoritesToolbar.setup(events, environment, preferences, slots);
  return { slots, preferences, clicked };
}

function recordButtonEvents(events: Events): ButtonEvent[] {
  const clicked: ButtonEvent[] = [];
  const { searchButtonClicked, resetButtonClicked, invertButtonClicked, scratchButtonClicked, shuffleButtonClicked } = events.favorites;

  searchButtonClicked.on(() => clicked.push("search"));
  resetButtonClicked.on(() => clicked.push("reset"));
  invertButtonClicked.on(() => clicked.push("invert"));
  scratchButtonClicked.on(() => clicked.push("scratch"));
  shuffleButtonClicked.on(() => clicked.push("shuffle"));
  return clicked;
}

function clickEach(container: HTMLElement): void {
  container.querySelectorAll("button").forEach(button => button.click());
}

function isActive(element: Element): boolean {
  return (element as HTMLElement).dataset.active !== undefined;
}

describe("FavoritesToolbar", () => {
  test("on desktop, offers reset, invert, and shuffle, each with its own event", () => {
    const { slots, clicked } = setup(true);

    clickEach(slots.buttons);
    expect(clicked.sort()).toEqual(["invert", "reset", "shuffle"]);
  });

  test("on mobile, offers reset and shuffle, but not invert", () => {
    const { slots, clicked } = setup(false);

    clickEach(slots.buttons);
    expect(clicked.sort()).toEqual(["reset", "shuffle"]);
  });

  test("the search button reports both left and right clicks", () => {
    const { slots, clicked } = setup();
    const button = slots.searchButton.querySelector("button") as HTMLButtonElement;

    button.click();
    button.dispatchEvent(new MouseEvent("contextmenu", { button: 2 }));
    expect(clicked).toEqual(["search", "search"]);
  });

  test("the drawer toggle opens and closes the drawer, and shows whether it is open", () => {
    const { slots, preferences } = setup();
    const toggle = slots.drawerToggle.querySelector("button") as HTMLButtonElement;

    expect(isActive(toggle)).toBe(false);
    toggle.click();
    expect(preferences.favorites.drawerOpen.value).toBe(true);
    expect(isActive(toggle)).toBe(true);
    toggle.click();
    expect(preferences.favorites.drawerOpen.value).toBe(false);
  });

  test("the drawer toggle follows the drawer when something else opens it", () => {
    const { slots, preferences } = setup();

    preferences.favorites.drawerOpen.set(true);
    expect(isActive(slots.drawerToggle.querySelector("button") as HTMLButtonElement)).toBe(true);
  });
});
