import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../../../lib/environment/environment";
import { Events } from "../../../../../lib/communication/events/events";
import { GALLERY_CSS } from "../../../../../assets/css";
import { GALLERY_DISABLED } from "../../../../../lib/environment/derived_environment";
import { indexCurrentPageThumbs } from "../../../model/gallery_model";
import { insertStyle } from "../../../../../utils/dom/injector";
import { mountGallery } from "../../../ui/gallery_shell";
import { onSearchPageCreated } from "../runtime/gallery_search_page_flow";
import { setupAutoplay } from "./gallery_autoplay_setup_flow";
import { setupDesktopGalleryMenu } from "../../../ui/gallery_desktop_menu";
import { setupGalleryController } from "../../gallery_controller";
import { setupGalleryInteractionTracker } from "../../events/desktop/gallery_interaction_tracker";
import { setupGalleryMobileTapControls } from "../../events/mobile/gallery_edge_tap_controls";
import { setupGalleryView } from "../../../view/gallery_view";
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
  indexCurrentPageThumbs();
  insertStyle(GALLERY_CSS);
  mountGallery();
  setupVisibleThumbObserver();
  setupGalleryMobileTapControls();
  setupGalleryInteractionTracker();
  setupGalleryView();
  setupGalleryMenu();
  setupGalleryController();
  setupAutoplay();

  if (ON_SEARCH_PAGE) {
    onSearchPageCreated();
  }
}

function setupGalleryMenu(): void {
  if (ON_MOBILE_DEVICE) {
    // setupMobileGalleryMenu();
  } else {
    setupDesktopGalleryMenu();
  }
}
