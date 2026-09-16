import { createElement, label, span } from "@/utils/browser/element";
import { Environment } from "@/app/context/environment";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { icon } from "@/lib/ui/icon";

export function build(environment: Environment): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbar,
    className: "u-no-select",
    children: [grid(environment)]
  });
}

function grid(environment: Environment): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbarGrid,
    children: [
      span(FavoritesId.drawerToggleSlot),
      searchField(),
      span(FavoritesId.buttonsSlot),
      span(FavoritesId.paginationSlot),
      status(),
      about(environment)
    ]
  });
}

function searchField(): HTMLElement {
  return createElement("div", {
    id: FavoritesId.searchField,
    children: [
      createElement("div", {
        id: FavoritesId.searchFieldInner,
        children: [
          span(FavoritesId.searchButton),
          span(FavoritesId.actions)
        ]
      })
    ]
  });
}

function status(): HTMLElement {
  return createElement("span", {
    id: FavoritesId.status,
    children: [
      label(FavoritesId.resultsCount),
      label(FavoritesId.loadStatus)
    ]
  });
}

function about(environment: Environment): HTMLElement {
  return createElement("div", {
    id: FavoritesId.aboutSlot,
    children: [
      help(),
      version(environment)
    ]
  });
}

function help(): HTMLElement {
  const button = createElement("button", {
    id: FavoritesId.aboutHelp,
    className: "menu-icon-btn",
    children: [icon("help")]
  });

  addTooltip(button, "Help", "below");
  return button;
}

function version(environment: Environment): HTMLElement {
  return createElement("span", {
    id: FavoritesId.aboutVersion,
    textContent: `v${environment.version}`
  });
}
