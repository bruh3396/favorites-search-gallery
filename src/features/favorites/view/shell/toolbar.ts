import { createElement, label, span } from "@/utils/dom/element_factory";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { VERSION } from "@/lib/environment";

export function build(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbar,
    className: "u-no-select",
    children: [buildToolbarGrid()]
  });
}

function buildToolbarGrid(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbarGrid,
    children: [
      span(FavoritesId.drawerToggleSlot),
      buildSearchField(),
      span(FavoritesId.buttonsSlot),
      span(FavoritesId.paginationSlot),
      buildStatus(),
      buildBrandSlot()
    ]
  });
}

function buildSearchField(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.searchField,
    children: [span(FavoritesId.searchButton), span(FavoritesId.actions)]
  });
}

function buildStatus(): HTMLElement {
  return createElement("span", {
    id: FavoritesId.status,
    children: [label(FavoritesId.matchCount), label(FavoritesId.loadStatus)]
  });
}

function buildBrandSlot(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.brandSlot,
    children: [createElement("span", { id: FavoritesId.brandVersion, textContent: `FSG v${VERSION}` })]
  });
}
