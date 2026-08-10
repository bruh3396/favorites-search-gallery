import { createElement, label, span } from "@/utils/dom/element_factory";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { VERSION } from "@/lib/environment";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { icon } from "@/lib/ui/icon";

export function build(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbar,
    className: "u-no-select",
    children: [grid()]
  });
}

function grid(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbarGrid,
    children: [
      span(FavoritesId.drawerToggleSlot),
      searchField(),
      span(FavoritesId.buttonsSlot),
      span(FavoritesId.paginationSlot),
      status(),
      about()
    ]
  });
}

function searchField(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.searchField,
    children: [span(FavoritesId.searchButton), span(FavoritesId.actions)]
  });
}

function status(): HTMLElement {
  return createElement("span", { id: FavoritesId.status, children: [label(FavoritesId.matchCount), label(FavoritesId.loadStatus)] });
}

function about(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.aboutSlot,
    children: [
      help(),
      version()
    ]
  });
}

function help(): HTMLElement {
  const button = createElement("button", { id: FavoritesId.aboutHelp, className: "menu-icon-btn", children: [icon("help")] });

  addTooltip(button, "Help", "below");
  return button;
}

function version(): HTMLElement {
  return createElement("span", { id: FavoritesId.aboutVersion, textContent: `v${VERSION}` });
}
