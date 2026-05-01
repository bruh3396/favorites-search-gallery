import * as GalleryAutoplayController from "./control/gallery_autoplay_controller";
import * as GalleryAutoplaySetupFlow from "./flow/gallery_autoplay_setup_flow";
import * as GalleryContentFlow from "./flow/gallery_content_flow";
import * as GalleryEdgeTapControls from "./control/gallery_edge_tap_controls";
import * as GalleryFavoritesFlow from "./flow/gallery_favorites_flow";
import * as GalleryInteractionFlow from "./flow/gallery_interaction_flow";
import * as GalleryInteractionTracker from "./control/gallery_interaction_tracker";
import * as GalleryKeyFlow from "./flow/gallery_key_flow";
import * as GalleryMenuFlow from "./flow/gallery_menu_flow";
import * as GalleryModel from "./model/gallery_model";
import * as GalleryMouseFlow from "./flow/gallery_mouse_flow";
import * as GalleryPreloadFlow from "./flow/gallery_preload_flow";
import * as GallerySearchPageFlow from "./flow/gallery_search_page_flow";
import * as GalleryStateFlow from "./flow/gallery_state_flow";
import * as GallerySwipeFlow from "./flow/gallery_swipe_flow";
import * as GalleryTouchFlow from "./flow/gallery_touch_flow";
import * as GalleryView from "./view/gallery_view";
import * as GalleryVisibleThumbObserver from "./control/gallery_visible_thumb_observer";
import { ON_DESKTOP_DEVICE, ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { GALLERY_DISABLED } from "../../lib/environment/derived_environment";

export function setupGallery(): void {
  if (GALLERY_DISABLED) {
    return;
  }

  if (ON_SEARCH_PAGE) {
    Events.searchPage.searchPageReady.on(performGallerySetup, { once: true });
  } else {
    performGallerySetup();
  }
}

function performGallerySetup(): void {
  GalleryModel.setupGalleryModel();
  GalleryVisibleThumbObserver.setupVisibleThumbObserver();
  GalleryEdgeTapControls.setupGalleryMobileTapControls();
  GalleryInteractionTracker.setupGalleryInteractionTracker();
  GalleryAutoplaySetupFlow.setupAutoplay();
  GalleryView.setupGalleryView();
  addEventListeners();
}

function addEventListeners(): void {
  addFavoritesEventListeners();
  addGalleryEventListeners();
  addPlatformEventListeners();
  addSearchPageEventListeners();
  addFeatureBridgeHandlers();
}

function addFavoritesEventListeners(): void {
  Events.favorites.newFavoritesFound.on(GalleryFavoritesFlow.handleNewFavoritesFound, { once: true });
  Events.favorites.pageChanged.on(GalleryContentFlow.handlePageChange);
  Events.favorites.favoritesAddedToCurrentPage.on(GalleryFavoritesFlow.handleFavoritesAddedToCurrentPage);
  Events.favorites.showOnHoverToggled.on(GalleryModel.toggleShowingContentOnHover);
}

function addGalleryEventListeners(): void {
  Events.gallery.visibleThumbsChanged.on(GalleryPreloadFlow.preloadAllVisibleContent);
  Events.gallery.videoEnded.on(GalleryAutoplayController.onVideoEnded);
  Events.gallery.videoDoubleClicked.on(GalleryStateFlow.exitGallery);
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);
}

function addSearchPageEventListeners(): void {
  Events.searchPage.upscaleToggled.on(GallerySearchPageFlow.onUpscaleToggled);
  Events.searchPage.searchPageCreated.on(GallerySearchPageFlow.onSearchPageCreated);
  Events.searchPage.moreResultsAdded.on(GallerySearchPageFlow.handleResultsAddedToSearchPage);
  Events.searchPage.infiniteScrollToggled.on(GalleryContentFlow.indexThumbs);
  Events.searchPage.pageChanged.on(GalleryContentFlow.handlePageChange);
}

function addFeatureBridgeHandlers(): void {
  FeatureBridge.inGallery.register(GalleryModel.inGallery);
}

function addPlatformEventListeners(): void {
  if (ON_DESKTOP_DEVICE) {
    addDesktopEventListeners();
  } else {
    addMobileEventListeners();
  }
}

function addDesktopEventListeners(): void {
  Events.document.mouseover.on(GalleryMouseFlow.onMouseOver);
  Events.document.click.on(GalleryMouseFlow.onClick);
  Events.document.mousedown.on(GalleryMouseFlow.onMouseDown);
  Events.document.contextmenu.on(GalleryMouseFlow.onContextMenu);
  Events.document.mousemove.on(GalleryMouseFlow.onMouseMove);
  Events.document.wheel.on(GalleryMouseFlow.onWheel);
  Events.document.keydown.on(GalleryKeyFlow.onKeyDown);
  Events.document.keyup.on(GalleryKeyFlow.onKeyUp);
  Events.gallery.interactionStopped.on(GalleryInteractionFlow.onInteractionStopped);
}

function addMobileEventListeners(): void {
  Events.gallery.leftTap.on(GalleryTouchFlow.onLeftTap);
  Events.gallery.rightTap.on(GalleryTouchFlow.onRightTap);
  Events.document.mousedown.on(GalleryTouchFlow.onMouseDown);
  Events.document.touchStart.on(GalleryTouchFlow.onTouchStart);
  Events.mobile.swipedDown.on(GallerySwipeFlow.onSwipeDown);
  Events.mobile.swipedUp.on(GalleryAutoplayController.showMenu);
  Events.window.orientationChange.on(GalleryView.correctOrientation);
}
