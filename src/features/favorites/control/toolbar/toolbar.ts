import { ButtonElement, buildButton } from "@/lib/ui/widgets/button";
import { Device, Environment } from "@/core/boundary/environment";
import { IconName } from "@/lib/ui/icon";
import { Events } from "@/app/context/events";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesToolbarSlots } from "@/types/favorites_ui";
import { Preferences } from "@/app/context/preferences";
import { buildToggleButton } from "@/lib/ui/settings/components/toggle_button";

interface ButtonConfig extends Partial<ButtonElement> {
  parent: HTMLElement;
}

type IconedButton = "reset" | "invert" | "shuffle";

const BUTTON_ICONS: Record<Device, Record<IconedButton, IconName | null>> = {
  desktop: { reset: null, invert: null, shuffle: null },
  mobile: { reset: "reset", invert: "changeDirection", shuffle: "shuffle" }
};

const INVERT_ENABLED: Record<Device, boolean> = {
  desktop: true,
  mobile: false
};

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
  const icons = BUTTON_ICONS[environment.device];
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
      icon: icons.reset,
      event: events.favorites.resetButtonClicked
    },
    {
      id: "invert-button",
      parent: slots.buttons,
      textContent: "INVERT",
      icon: icons.invert,
      enabled: INVERT_ENABLED[environment.device],
      event: events.favorites.invertButtonClicked
    },
    {
      id: "scratch-button",
      parent: slots.buttons,
      textContent: "SCRATCH",
      enabled: false,
      event: events.favorites.scratchButtonClicked
    },
    {
      id: "shuffle-button",
      parent: slots.buttons,
      textContent: "SHUFFLE",
      icon: icons.shuffle,
      event: events.favorites.shuffleButtonClicked
    }
  ];
}

function insertButton(config: ButtonConfig): void {
  if (config.enabled === false) {
    return;
  }
  config.parent.insertAdjacentElement(config.position ?? "afterbegin", buildButton(config));
}
