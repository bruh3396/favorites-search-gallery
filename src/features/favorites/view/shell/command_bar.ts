import { div, label, span } from "@/utils/dom/element";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { VERSION } from "@/lib/environment";

export function build(): HTMLElement {
  const commandBar = div(FavoritesId.commandBar);
  const grid = div(FavoritesId.grid);
  const brandSlot = buildBrandSlot();
  const pill = div(FavoritesId.pill);
  const searchButton = span(FavoritesId.searchButton);
  const actions = span(FavoritesId.actions);
  const status = span(FavoritesId.status);
  const drawerToggleSlot = span(FavoritesId.drawerToggleSlot);
  const paginationSlot = span(FavoritesId.paginationSlot);
  const resetSlot = span(FavoritesId.resetSlot);
  const matchCount = label(FavoritesId.matchCount);
  const loadStatus = label(FavoritesId.loadStatus);

  commandBar.className = "u-no-select";
  pill.append(searchButton, actions);
  status.append(matchCount, loadStatus);
  grid.append(drawerToggleSlot, pill, paginationSlot, status, resetSlot, brandSlot);
  commandBar.append(grid);
  return commandBar;
}

function buildBrandSlot(): HTMLElement {
  const brandSlot = div(FavoritesId.brandSlot);
  const version = span(FavoritesId.brandVersion);

  version.textContent = `v${VERSION}`;
  brandSlot.append(version);
  return brandSlot;
}
