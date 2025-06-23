import { insertFavoritesSearchGalleryContainer } from "../global/container";
import { loadTagModifications } from "../global/tag_modifier";
import { setupCommonStyles } from "../../utils/dom/style";
import { setupEvents } from "../global/events/events";
import { setupExtensions } from "../global/extensions";

export function setupGlobals(): void {
  setupEvents();
  setupExtensions();
  setupCommonStyles();
  loadTagModifications();
  insertFavoritesSearchGalleryContainer();
}
