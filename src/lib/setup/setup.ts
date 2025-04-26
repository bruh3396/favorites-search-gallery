import {ON_FAVORITES_PAGE} from "../functional/flags";
import {buildFavoritesPage} from "../favorites_page/builder";
import {insertFavoritesSearchGalleryContainer} from "../favorites_page/container";
import {prepareFavoritesPage} from "../favorites_page/preparer";
import {setupAliases} from "../../store/aliases";
import {setupEvents} from "../functional/events";
import {setupExtensions} from "../../store/extensions";

export function setupFavoritesSearchGallery(): void {
  setupAllPages();
  setupFavoritesPage();
}

function setupAllPages(): void {
  setupEvents();
  setupExtensions();
}

function setupFavoritesPage(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  setupAliases();
  prepareFavoritesPage();
  insertFavoritesSearchGalleryContainer();
  buildFavoritesPage();
}
