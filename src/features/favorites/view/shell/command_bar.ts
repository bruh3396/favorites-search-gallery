import { FavoritesMenuId } from "@/features/favorites/types/scaffold";

export function build(): HTMLElement {
  const menu = div(FavoritesMenuId.menu);

  menu.className = "u-no-select";

  const bar = div(FavoritesMenuId.bar);
  const pill = div(FavoritesMenuId.pill);

  pill.append(span(FavoritesMenuId.searchButton), span(FavoritesMenuId.actions));

  const status = span(FavoritesMenuId.status);

  status.append(label(FavoritesMenuId.matchCount), label(FavoritesMenuId.loadStatus));

  bar.append(span(FavoritesMenuId.settingsSlot), pill, span(FavoritesMenuId.paginationSlot), status);
  menu.append(bar);
  return menu;
}

function div(id: string): HTMLDivElement {
  const element = document.createElement("div");

  element.id = id;
  return element;
}

function span(id: string): HTMLSpanElement {
  const element = document.createElement("span");

  element.id = id;
  return element;
}

function label(id: string): HTMLLabelElement {
  const element = document.createElement("label");

  element.id = id;
  return element;
}
