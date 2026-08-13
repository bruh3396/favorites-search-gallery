import { ButtonElement, buildButton } from "@/lib/ui/widgets/button";
import { Events } from "@/app/channels/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
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
    event: Events.favorites.resetButtonClicked
  },
  {
    id: "invert-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "INVERT",
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "SHUFFLE",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: FavoritesId.clearButton,
    parentId: FavoritesId.actions,
    icon: "clear",
    event: Events.favorites.clearButtonClicked
  },
  {
    id: "set_search_scope_button",
    parentId: FavoritesId.actions,
    textContent: "Set Subset",
    title: "Make the current search results the entire set of results to search from",
    enabled: false,
    event: Events.favorites.setSearchScopeButtonClicked
  },
  {
    id: "clear_search_scope_button",
    parentId: FavoritesId.actions,
    textContent: "Stop Subset",
    title: "Reset active favorites to all",
    enabled: false,
    event: Events.favorites.clearSearchScopeButtonClicked
  }
];

function insertButton(config: Partial<ButtonElement>): void {
  if (config.enabled === false || config.parentId === undefined) {
    return;
  }
  const parent = document.getElementById(config.parentId);

  parent?.insertAdjacentElement(config.position ?? "afterbegin", buildButton(config));
}
