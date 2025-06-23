import { ON_FAVORITES_PAGE } from "../../lib/global/flags/intrinsic_flags";

export function setFavoritesPageTitle(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  document.title = "Favorites Search Gallery";
}
