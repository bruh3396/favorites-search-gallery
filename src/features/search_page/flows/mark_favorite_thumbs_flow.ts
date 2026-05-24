import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageView from "../view/search_page_view";

export function markFavoriteThumbs(thumbs: HTMLElement[]): void {
  for (const thumb of thumbs) {
    if (SearchPageModel.isFavorite(thumb.id)) {
      SearchPageView.markThumbAsFavorite(thumb);
    }
  }
}

export function markNewFavorite(id: string): void {
  if (SearchPageModel.isFavorite(id)) {
    return;
  }
  SearchPageModel.addFavoriteId(id);
  const thumb = document.getElementById(id);
  if (thumb !== null) {
    SearchPageView.markThumbAsFavorite(thumb);
  }
}
