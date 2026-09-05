import { ButtonElement, buildButton } from "@/lib/ui/widgets/button";
import { Events } from "@/app/channels/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { buildToggleButton } from "@/lib/ui/settings/components/toggle_button";

export function setup(): void {
  buttons.forEach(insertButton);
  insertDrawerToggle();
}

function insertDrawerToggle(): void {
  const drawerToggle = buildToggleButton({
    id: FavoritesId.drawerToggleButton,
    tooltip: "Menu",
    preference: Preferences.favorites.drawerOpen
  }, "hamburger");

  document.getElementById(FavoritesId.drawerToggleSlot)?.appendChild(drawerToggle);
}

const buttons: Partial<ButtonElement>[] = [
  {
    id: "search-button",
    parentId: FavoritesId.searchButton,
    icon: "search",
    rightClickEnabled: true,
    event: Events.favorites.searchButtonClicked
  },
  {
    id: "reset-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "RESET",
    icon: ON_DESKTOP_DEVICE ? null : "reset",
    event: Events.favorites.resetButtonClicked
  },
  {
    id: "invert-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "INVERT",
    icon: ON_DESKTOP_DEVICE ? null : "changeDirection",
    enabled: ON_DESKTOP_DEVICE,
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "SHUFFLE",
    icon: ON_DESKTOP_DEVICE ? null : "shuffle",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: FavoritesId.clearButton,
    parentId: FavoritesId.actions,
    icon: "clear",
    event: Events.favorites.clearButtonClicked
  }
];

function insertButton(config: Partial<ButtonElement>): void {
  if (config.enabled === false || config.parentId === undefined) {
    return;
  }
  const parent = document.getElementById(config.parentId);

  parent?.insertAdjacentElement(config.position ?? "afterbegin", buildButton(config));
}
