import { ButtonElement } from "@/types/element";
import { Events } from "@/app/channels/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { buildButton } from "@/lib/ui/elements/button";

export function setup(): void {
  buttons.forEach(insertButton);
}

const buttons: Partial<ButtonElement>[] = [
  {
    id: "search-button",
    parentId: FavoritesId.searchButton,
    title: "Search",
    icon: "search",
    rightClickEnabled: true,
    event: Events.favorites.searchButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "SHUFFLE",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: "invert-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "INVERT",
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "clear-button",
    parentId: FavoritesId.actions,
    icon: "clear",
    title: "Clear",
    event: Events.favorites.clearButtonClicked
  },
  {
    id: "set-active_favorites_button",
    parentId: FavoritesId.actions,
    textContent: "Set Subset",
    title: "Make the current search results the entire set of results to search from",
    enabled: false,
    event: Events.favorites.setActiveFavoritesClicked
  },
  {
    id: "reset-active_favorites_button",
    parentId: FavoritesId.actions,
    textContent: "Stop Subset",
    title: "Reset active favorites to all",
    enabled: false,
    event: Events.favorites.resetActiveFavoritesClicked
  },
  {
    id: FavoritesId.panelButton,
    parentId: FavoritesId.drawerToggleSlot,
    icon: "hamburger",
    title: "Menu",
    event: Events.favorites.panelButtonClicked
  },
  {
    id: "reset-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "RESET",
    event: Events.favorites.resetButtonClicked
  }
];

function insertButton(config: Partial<ButtonElement>): void {
  if (config.enabled === false || config.parentId === undefined) {
    return;
  }
  const parent = document.getElementById(config.parentId);

  parent?.insertAdjacentElement(config.position ?? "afterbegin", buildButton(config));
}
