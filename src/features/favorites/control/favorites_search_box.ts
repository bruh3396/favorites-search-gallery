import { FavoritesDesktopSearchBox } from "@/features/favorites/control/desktop/search_box";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";

let searchBox: FavoritesDesktopSearchBox | null = null;

export function setup(): void {
  if (ON_DESKTOP_DEVICE) {
    searchBox = new FavoritesDesktopSearchBox(FavoritesId.searchField);
  }
}

export const append = (text: string): void => searchBox?.append(text);
export const exclude = (tag: string): void => searchBox?.append(`-${tag}`);
export const search = (query: string): void => searchBox?.search(query);
export const clear = (): void => searchBox?.clear();
export const handleSearchButtonClicked = (event: MouseEvent): void => searchBox?.handleSearchButtonClicked(event);
