import { div, label, span } from "@/utils/dom/element";
import { FavoritesMenuId } from "@/features/favorites/types/scaffold";

export function build(): HTMLElement {
  const commandBar = div(FavoritesMenuId.commandBar);
  const grid = div(FavoritesMenuId.grid);
  const pill = div(FavoritesMenuId.pill);
  const searchButton = span(FavoritesMenuId.searchButton);
  const actions = span(FavoritesMenuId.actions);
  const status = span(FavoritesMenuId.status);
  const drawerToggleSlot = span(FavoritesMenuId.drawerToggleSlot);
  const paginationSlot = span(FavoritesMenuId.paginationSlot);
  const resetSlot = span(FavoritesMenuId.resetSlot);
  const matchCount = label(FavoritesMenuId.matchCount);
  const loadStatus = label(FavoritesMenuId.loadStatus);

  commandBar.className = "u-no-select";
  pill.append(searchButton, actions);
  status.append(matchCount, loadStatus);
  grid.append(drawerToggleSlot, pill, paginationSlot, status, resetSlot);
  commandBar.append(grid);
  return commandBar;
}
