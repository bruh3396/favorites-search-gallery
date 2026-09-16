import { ButtonElement, buildButton } from "@/lib/ui/widgets/button";
import { Environment } from "@/app/context/environment";
import { Events } from "@/app/context/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { Preferences } from "@/app/context/preferences";
import { buildToggleButton } from "@/lib/ui/settings/components/toggle_button";

export function setup(events: Events, environment: Environment, preferences: Preferences): void {
  buildButtons(events, environment).forEach(insertButton);
  insertDrawerToggle(preferences);
}

function insertDrawerToggle(preferences: Preferences): void {
  const drawerToggle = buildToggleButton({
    id: FavoritesId.drawerToggleButton,
    tooltip: "Menu",
    preference: preferences.favorites.drawerOpen
  }, "hamburger");

  document.getElementById(FavoritesId.drawerToggleSlot)?.appendChild(drawerToggle);
}

function buildButtons(events: Events, environment: Environment): Partial<ButtonElement>[] {
  const onDesktop = environment.onDesktopDevice;
  return [
    {
      id: "search-button",
      parentId: FavoritesId.searchButton,
      icon: "search",
      rightClickEnabled: true,
      event: events.favorites.searchButtonClicked
    },
    {
      id: "reset-button",
      parentId: FavoritesId.buttonsSlot,
      textContent: "RESET",
      icon: onDesktop ? null : "reset",
      event: events.favorites.resetButtonClicked
    },
    {
      id: "invert-button",
      parentId: FavoritesId.buttonsSlot,
      textContent: "INVERT",
      icon: onDesktop ? null : "changeDirection",
      enabled: onDesktop,
      event: events.favorites.invertButtonClicked
    },
    {
      id: "shuffle-button",
      parentId: FavoritesId.buttonsSlot,
      textContent: "SHUFFLE",
      icon: onDesktop ? null : "shuffle",
      event: events.favorites.shuffleButtonClicked
    },
    {
      id: FavoritesId.clearButton,
      parentId: FavoritesId.actions,
      icon: "clear",
      event: events.favorites.clearButtonClicked
    }
  ];
}

function insertButton(config: Partial<ButtonElement>): void {
  if (config.enabled === false || config.parentId === undefined) {
    return;
  }
  const parent = document.getElementById(config.parentId);

  parent?.insertAdjacentElement(config.position ?? "afterbegin", buildButton(config));
}
