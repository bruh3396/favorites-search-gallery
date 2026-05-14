import { Favorite } from "../../../types/favorite";
import { FavoritesConfig } from "../../../config/favorites_config";
import { Preferences } from "../../../lib/preferences/preferences";
import { ScrollExpansionResult } from "../types/favorite_types";

let favorites: Favorite[] = [];
let renderedStart = 0;
let renderedEnd = 0;

export const hasMore = (): boolean => renderedEnd < favorites.length;
export const hasMoreAbove = (): boolean => renderedStart > 0;

export function setFavorites(newFavorites: Favorite[]): void {
  favorites = newFavorites;
  renderedStart = 0;
  renderedEnd = Math.min(favorites.length, batchSize());
}

export function initialSlice(): Favorite[] {
  return favorites.slice(0, renderedEnd);
}

export function expandBelow(): ScrollExpansionResult {
  const slice = favorites.slice(renderedEnd, renderedEnd + batchSize());

  renderedEnd += slice.length;
  const trimmed = trimTop();
  return { slice, trimmed };
}

export function expandAbove(): ScrollExpansionResult {
  const size = alignDown(Math.min(renderedStart, batchSize()));
  const start = renderedStart - size;
  const slice = favorites.slice(start, renderedStart);

  renderedStart = start;
  const trimmed = trimBottom();
  return { slice, trimmed };
}

function trimTop(): Favorite[] {
  if (!FavoritesConfig.infiniteScrollWindowed) {
    return [];
  }
  const excess = alignDown(renderedEnd - renderedStart - maxVisible());

  if (excess <= 0) {
    return [];
  }
  const trimmed = favorites.slice(renderedStart, renderedStart + excess);

  renderedStart += excess;
  return trimmed;
}

function trimBottom(): Favorite[] {
  if (!FavoritesConfig.infiniteScrollWindowed) {
    return [];
  }
  const excess = renderedEnd - renderedStart - maxVisible();

  if (excess <= 0) {
    return [];
  }
  const trimmed = favorites.slice(renderedEnd - excess, renderedEnd);

  renderedEnd -= excess;
  return trimmed;
}

function batchSize(): number {
  const row = itemsPerRow();
  return Math.max(row, Math.floor(FavoritesConfig.infiniteScrollBatchSize / row) * row);
}

function maxVisible(): number {
  const row = itemsPerRow();
  return Math.max(row, Math.floor(FavoritesConfig.infiniteScrollMaxVisible / row) * row);
}

function alignDown(n: number): number {
  const row = itemsPerRow();
  return Math.floor(n / row) * row;
}

function itemsPerRow(): number {
  return Math.max(1, Preferences.columnCount.value);
}
