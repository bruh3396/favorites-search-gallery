import { decorateTab } from "../../utils/misc/tab_decorator";
import { insertFavoritesSearchGalleryContainer } from "../global/container";
import { setupCommonStyles } from "../../utils/dom/style";
import { setupEvents } from "../global/events/events";
import { setupExtensions } from "../../store/indexed_db/extensions";
import { setupGlobalQueues } from "../global/fetch_queues";

export function setupGlobals(): void {
  setupEvents();
  setupExtensions();
  setupCommonStyles();
  setupGlobalQueues();
  insertFavoritesSearchGalleryContainer();
  decorateTab();
}
