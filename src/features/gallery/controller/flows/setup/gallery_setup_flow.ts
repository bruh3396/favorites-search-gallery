import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { GALLERY_DISABLED } from "../../../../../lib/global/flags/derived_flags";
import { addGalleryEventListeners } from "../../events/gallery_event_listeners";
import { indexCurrentPageThumbs } from "../../../model/gallery_model";
import { insertGalleryContainer } from "../../../ui/gallery_container";
import { prepareAllThumbsOnSearchPage } from "../../../../../utils/dom/search_page_utils";
import { setupAutoplay } from "./gallery_autoplay_setup_flow";
import { setupDesktopGalleryMenu } from "../../../ui/gallery_desktop_menu";
import { setupGalleryInteractionTracker } from "../../events/desktop/gallery_interaction_tracker";
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
  setupGalleryInteractionTracker();
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

function setupGalleryMenu(): void {
  if (ON_MOBILE_DEVICE) {
    // setupMobileGalleryMenu();
  } else {
    setupDesktopGalleryMenu();
  }
}
