import { FavoritesToolbarBuild, FavoritesToolbarSlots } from "@/features/favorites/types/types";
import { createElement, label, span } from "@/utils/browser/element";
import { Environment } from "@/app/context/environment";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { icon } from "@/lib/ui/icon";

export function build(environment: Environment): FavoritesToolbarBuild {
  const slots: FavoritesToolbarSlots = {
    drawerToggle: span(FavoritesId.drawerToggleSlot),
    searchField: span(),
    searchButton: span(FavoritesId.searchButton),
    searchActions: span(FavoritesId.searchActions),
    buttons: span(FavoritesId.buttonsSlot),
    paginationSlot: span(FavoritesId.paginationSlot),
    loadStatus: label(FavoritesId.loadStatus),
    resultsCount: label(FavoritesId.resultsCount),
    aboutHelp: help(),
    aboutVersion: version(environment)
  };
  const root = createElement("div", {
    id: FavoritesId.toolbar,
    className: "u-no-select",
    children: [grid(slots)]
  });
  return { root, slots };
}

function grid(slots: FavoritesToolbarSlots): HTMLElement {
  return createElement("div", {
    id: FavoritesId.toolbarGrid,
    children: [
      slots.drawerToggle,
      searchField(slots),
      slots.buttons,
      slots.paginationSlot,
      status(slots),
      about(slots)
    ]
  });
}

function searchField(slots: FavoritesToolbarSlots): HTMLElement {
  slots.searchField.id = FavoritesId.searchField;
  slots.searchField.append(createElement("div", {
    id: FavoritesId.searchFieldInner,
    children: [
      slots.searchButton,
      slots.searchActions
    ]
  }));
  return slots.searchField;
}

function status(slots: FavoritesToolbarSlots): HTMLElement {
  return createElement("span", {
    id: FavoritesId.status,
    children: [
      slots.resultsCount,
      slots.loadStatus
    ]
  });
}

function about(slots: FavoritesToolbarSlots): HTMLElement {
  return createElement("div", {
    id: FavoritesId.aboutSlot,
    children: [
      slots.aboutHelp,
      slots.aboutVersion
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
