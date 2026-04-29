import { ON_FAVORITES_PAGE } from "../environment/environment";
import { Preferences } from "./preferences";

export function usingInfiniteScrollOnSearchPage(): boolean {
  return Preferences.searchPageInfiniteScroll.value;
}

export function usingInfiniteScrollOnFavoritesPage(): boolean {
  return Preferences.infiniteScroll.value;
}

export const usingInfiniteScroll = ON_FAVORITES_PAGE ? usingInfiniteScrollOnFavoritesPage : usingInfiniteScrollOnSearchPage;
