import * as GalleryModel from "../../../model/gallery_model";
import * as GallerySearchPageFlow from "../runtime/gallery_search_page_flow";
import * as GalleryView from "../../../view/gallery_view";
import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { Events } from "../../../../../lib/global/events/events";
import { GALLERY_DISABLED } from "../../../../../lib/global/flags/derived_flags";
import { addGalleryEventListeners } from "../../events/gallery_event_listeners";
import { insertGalleryContainer } from "../../../ui/gallery_container";
import { setupAutoplay } from "./gallery_autoplay_setup_flow";
import { setupDesktopGalleryMenu } from "../../../ui/gallery_desktop_menu";
import { setupGalleryInteractionTracker } from "../../events/desktop/gallery_interaction_tracker";
import { setupGalleryMobileTapControls } from "../../events/mobile/gallery_edge_tap_controls";
import { setupVisibleThumbObserver } from "../../events/desktop/gallery_visible_thumb_observer";

export function setupGallery(): void {
  if (GALLERY_DISABLED) {
    return;
  }

  if (ON_SEARCH_PAGE) {
    Events.searchPage.searchPageReady.on(setupGalleryHelper, {once: true});
    return;
  }
  setupGalleryHelper();
}

function setupGalleryHelper(): void {
  GalleryModel.indexCurrentPageThumbs();
  insertGalleryContainer();
  setupVisibleThumbObserver();
  setupGalleryMobileTapControls();
  setupGalleryInteractionTracker();
  GalleryView.setupGalleryView();
  setupGalleryMenu();
  addGalleryEventListeners();
  setupAutoplay();

  if (ON_SEARCH_PAGE) {
    GallerySearchPageFlow.onSearchPageCreated();
  }
}

function setupGalleryMenu(): void {
  if (ON_MOBILE_DEVICE) {
    // setupMobileGalleryMenu();
  } else {
    setupDesktopGalleryMenu();
  }
}
