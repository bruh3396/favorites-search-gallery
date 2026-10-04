import * as FavoritesToolbar from "@/features/favorites/control/toolbar/toolbar";
import { Events, createEvents } from "@/app/context/events";
import { describe, expect, test } from "vitest";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesToolbarSlots } from "@/types/favorites_ui";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createPreferences } from "@/testing/preferences";

type ButtonEvent = "search" | "invert" | "scratch" | "shuffle";

interface Setup {
  slots: FavoritesToolbarSlots;
  preferences: Preferences;
  clicked: ButtonEvent[];
}

function setup(onDesktopDevice = true): Setup {
  const environment = createEnvironment({ device: onDesktopDevice ? "desktop" : "mobile" });
  const slots = new FavoritesShell(environment, new Shell()).toolbar;
  const preferences = createPreferences({ favorites: { drawerOpen: false } });
  const events = createEvents();
  const clicked = recordButtonEvents(events);

  FavoritesToolbar.setup({ events, environment, preferences }, slots);
  return { slots, preferences, clicked };
}

function recordButtonEvents(events: Events): ButtonEvent[] {
  const clicked: ButtonEvent[] = [];
  const { searchButtonClicked, invertButtonClicked, shuffleButtonClicked } = events.favorites;

  searchButtonClicked.on(() => clicked.push("search"));
  invertButtonClicked.on(() => clicked.push("invert"));
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
  test("offers invert and shuffle on desktop, each with its own event", () => {
    const { slots, clicked } = setup(true);

    clickEach(slots.buttons);
    expect(clicked.sort()).toEqual(["invert", "shuffle"]);
  });

  test("offers shuffle but not invert on mobile", () => {
    const { slots, clicked } = setup(false);

    clickEach(slots.buttons);
    expect(clicked).toEqual(["shuffle"]);
  });

  test("reports both left and right clicks on the search button", () => {
    const { slots, clicked } = setup();
    const button = slots.searchButton.querySelector("button") as HTMLButtonElement;

    button.click();
    button.dispatchEvent(new MouseEvent("contextmenu", { button: 2 }));
    expect(clicked).toEqual(["search", "search"]);
  });

  test("opens and closes the drawer from its toggle, and shows on the toggle whether it is open", () => {
    const { slots, preferences } = setup();
    const toggle = slots.drawerToggle.querySelector("button") as HTMLButtonElement;

    expect(isActive(toggle)).toBe(false);
    toggle.click();
    expect(preferences.favorites.drawerOpen.value).toBe(true);
    expect(isActive(toggle)).toBe(true);
    toggle.click();
    expect(preferences.favorites.drawerOpen.value).toBe(false);
  });

  test("keeps the drawer toggle in step when something else opens the drawer", () => {
    const { slots, preferences } = setup();

    preferences.favorites.drawerOpen.set(true);
    expect(isActive(slots.drawerToggle.querySelector("button") as HTMLButtonElement)).toBe(true);
  });
});
