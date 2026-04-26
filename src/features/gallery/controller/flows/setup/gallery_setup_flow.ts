import * as GalleryModel from "../../../model/gallery_model";
import * as GallerySearchPageFlow from "../runtime/gallery_search_page_flow";
import * as GalleryView from "../../../view/gallery_view";
import * as GalleryVisibleThumbObserver from "../../events/desktop/gallery_visible_thumb_observer";
import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../../../lib/environment/environment";
import { Events } from "../../../../../lib/communication/events";
import { GALLERY_DISABLED } from "../../../../../lib/environment/derived_environment";
import { insertGalleryContainer } from "../../../ui/gallery_container";
import { setupAutoplay } from "./gallery_autoplay_setup_flow";
import { setupDesktopGalleryMenu } from "../../../ui/gallery_desktop_menu";
import { setupGalleryController } from "../../gallery_controller";
import { setupGalleryInteractionTracker } from "../../events/desktop/gallery_interaction_tracker";
import { setupGalleryMobileTapControls } from "../../events/mobile/gallery_edge_tap_controls";

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
  GalleryVisibleThumbObserver.setupVisibleThumbObserver();
  setupGalleryMobileTapControls();
  setupGalleryInteractionTracker();
  GalleryView.setupGalleryView();
  setupGalleryMenu();
  setupGalleryController();
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
