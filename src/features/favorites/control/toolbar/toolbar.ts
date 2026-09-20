import { ButtonElement, buildButton } from "@/lib/ui/widgets/button";
import { Environment } from "@/app/context/environment";
import { Events } from "@/app/context/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { FavoritesToolbarSlots } from "@/features/favorites/types/types";
import { Preferences } from "@/app/context/preferences";
import { buildToggleButton } from "@/lib/ui/settings/components/toggle_button";

interface ButtonConfig extends Partial<ButtonElement> {
  parent: HTMLElement;
}

export function setup(events: Events, environment: Environment, preferences: Preferences, slots: FavoritesToolbarSlots): void {
  buildButtons(events, environment, slots).forEach(insertButton);
  insertDrawerToggle(preferences, slots);
}

function insertDrawerToggle(preferences: Preferences, slots: FavoritesToolbarSlots): void {
  const drawerToggle = buildToggleButton({
    id: FavoritesId.drawerToggleButton,
    tooltip: "Menu",
    preference: preferences.favorites.drawerOpen
  }, "hamburger");

  slots.drawerToggle.appendChild(drawerToggle);
}

function buildButtons(events: Events, environment: Environment, slots: FavoritesToolbarSlots): ButtonConfig[] {
  const onDesktop = environment.onDesktopDevice;
  return [
    {
      id: "search-button",
      parent: slots.searchButton,
      icon: "search",
      rightClickEnabled: true,
      event: events.favorites.searchButtonClicked
    },
    {
      id: "reset-button",
      parent: slots.buttons,
      textContent: "RESET",
      icon: onDesktop ? null : "reset",
      event: events.favorites.resetButtonClicked
    },
    {
      id: "invert-button",
      parent: slots.buttons,
      textContent: "INVERT",
      icon: onDesktop ? null : "changeDirection",
      enabled: onDesktop,
      event: events.favorites.invertButtonClicked
    },
    {
      id: "shuffle-button",
      parent: slots.buttons,
      textContent: "SHUFFLE",
      icon: onDesktop ? null : "shuffle",
      event: events.favorites.shuffleButtonClicked
    },
    {
      id: FavoritesId.clearButton,
      parent: slots.searchActions,
      icon: "clear",
      event: events.favorites.clearButtonClicked
    }
  ];
}

function insertButton(config: ButtonConfig): void {
  if (config.enabled === false) {
    return;
  }
  config.parent.insertAdjacentElement(config.position ?? "afterbegin", buildButton(config));
}
