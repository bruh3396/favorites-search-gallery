import { FavoritesDesktopSearchBox } from "@/features/favorites/control/desktop/search_box";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";

let searchBox: FavoritesDesktopSearchBox | null = null;

export function setup(): void {
  if (ON_DESKTOP_DEVICE) {
    searchBox = new FavoritesDesktopSearchBox(FavoritesId.searchField);
  }
}

export function append(text: string): void {
  searchBox?.append(text);
}

export function exclude(tag: string): void {
  searchBox?.append(`-${tag}`);
}

export function search(query: string): void {
  searchBox?.search(query);
}

export function clear(): void {
  searchBox?.clear();
}

export function handleSearchButtonClicked(event: MouseEvent): void {
  searchBox?.handleSearchButtonClicked(event);
}
