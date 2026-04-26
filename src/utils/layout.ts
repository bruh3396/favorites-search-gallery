import { ON_FAVORITES_PAGE } from "../lib/environment/environment";
import { Preferences } from "../lib/preferences";

export function usingInfiniteScrollOnSearchPage(): boolean {
  return Preferences.searchPageInfiniteScrollEnabled.value;
}

export function usingInfiniteScrollOnFavoritesPage(): boolean {
  return Preferences.infiniteScrollEnabled.value;
}

export const usingInfiniteScroll = ON_FAVORITES_PAGE ? usingInfiniteScrollOnFavoritesPage : usingInfiniteScrollOnSearchPage;
