import { div, label, span } from "@/utils/dom/element_factory";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { VERSION } from "@/lib/environment";

export function build(): HTMLElement {
  const toolbar = div(FavoritesId.toolbar);
  const grid = div(FavoritesId.grid);
  const brandSlot = buildBrandSlot();
  const searchField = div(FavoritesId.searchField);
  const searchButton = span(FavoritesId.searchButton);
  const actions = span(FavoritesId.actions);
  const status = span(FavoritesId.status);
  const drawerToggleSlot = span(FavoritesId.drawerToggleSlot);
  const paginationSlot = span(FavoritesId.paginationSlot);
  const buttonsSlot = span(FavoritesId.buttonsSlot);
  const matchCount = label(FavoritesId.matchCount);
  const loadStatus = label(FavoritesId.loadStatus);

  toolbar.className = "u-no-select";
  searchField.append(searchButton, actions);
  status.append(matchCount, loadStatus);
  grid.append(drawerToggleSlot, searchField, buttonsSlot, paginationSlot, status, brandSlot);
  toolbar.append(grid);
  return toolbar;
}

function buildBrandSlot(): HTMLElement {
  const brandSlot = div(FavoritesId.brandSlot);
  const version = span(FavoritesId.brandVersion);

  version.textContent = `v${VERSION}`;
  brandSlot.append(version);
  return brandSlot;
}
