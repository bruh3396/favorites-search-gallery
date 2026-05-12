import * as FavoritesDesktop from "./menu/desktop";
import * as FavoritesFinder from "./menu/finder";
import * as FavoritesMobile from "./menu/mobile";
import * as FavoritesNavigationButtons from "./navigation_buttons";
import * as FavoritesRatingFilter from "./menu/rating_filter";
import * as FavoritesSearchBox from "./search_box/search_box";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";

export function setup(): void {
  FavoritesNavigationButtons.setup();
  FavoritesFinder.setup();
  FavoritesRatingFilter.setup();
  FavoritesSearchBox.setup();

  if (ON_DESKTOP_DEVICE) {
    FavoritesDesktop.buildElements();
  } else {
    FavoritesMobile.buildElements();
  }
}
