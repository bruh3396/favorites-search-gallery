import { GALLERY_DISABLED, ON_SEARCH_PAGE } from "../../../../../lib/globals/flags";
import { addGalleryEventListeners } from "../../events/gallery_event_listeners";
import { indexCurrentPageThumbs } from "../../../model/gallery_model";
import { insertGalleryContainer } from "../../../ui/gallery_container";
import { prepareAllThumbsOnSearchPage } from "../../../../../types/search_page";
import { setupAutoplay } from "./gallery_autoplay_setup_flow";
import { setupGalleryMenu } from "../../../ui/gallery_menu";
import { setupGalleryMobileSwipeControls } from "../../events/mobile/gallery_swipe_controls";
import { setupGalleryMobileTapControls } from "../../events/mobile/gallery_edge_tap_controls";
import { setupGalleryView } from "../../../view/gallery_view";
import { setupSearchPageLoader } from "../../../model/search_page_loader";
import { setupVisibleThumbObserver } from "../../events/desktop/gallery_visible_thumb_observer";
import { waitForDOMToLoad } from "../../../../../utils/dom/dom";

export async function setupGallery(): Promise<void> {
  if (GALLERY_DISABLED) {
    return;
  }
  await setupSearchPageGallery();
  insertGalleryContainer();
  setupVisibleThumbObserver();
  setupGalleryMobileTapControls();
  setupGalleryMobileSwipeControls();
  setupGalleryView();
  setupGalleryMenu();
  addGalleryEventListeners();
  setupAutoplay();
}

async function setupSearchPageGallery(): Promise<void> {
  if (ON_SEARCH_PAGE) {
    await waitForDOMToLoad();
    prepareAllThumbsOnSearchPage();
    indexCurrentPageThumbs();
    setupSearchPageLoader();
  }
}
