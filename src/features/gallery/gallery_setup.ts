import * as GalleryAutoplayController from "./control/gallery_autoplay_controller";
import * as GalleryAutoplaySetupFlow from "./flow/gallery_autoplay_setup_flow";
import * as GalleryClickFlow from "./flow/gallery_click_flow";
import * as GalleryContentFlow from "./flow/gallery_content_flow";
import * as GalleryEdgeTapControls from "./control/gallery_edge_tap_controls";
import * as GalleryInteractionFlow from "./flow/gallery_interaction_flow";
import * as GalleryInteractionTracker from "./control/gallery_interaction_tracker";
import * as GalleryKeyFlow from "./flow/gallery_key_flow";
import * as GalleryMenuFlow from "./flow/gallery_menu_flow";
import * as GalleryModel from "./model/gallery_model";
import * as GalleryMouseOverFlow from "./flow/gallery_mouseover_flow";
import * as GalleryPreloadFlow from "./flow/gallery_preload_flow";
import * as GallerySearchPageFlow from "./flow/gallery_search_page_flow";
import * as GalleryStateFlow from "./flow/gallery_state_flow";
import * as GallerySwipeFlow from "./flow/gallery_swipe_flow";
import * as GalleryTouchFlow from "./flow/gallery_touch_flow";
import * as GalleryView from "./view/gallery_view";
import * as GalleryVisibleThumbObserver from "./control/gallery_visible_thumb_observer";
import * as GalleryWheelFlow from "./flow/gallery_wheel_flow";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { Events } from "../../lib/communication/events";
import { FeatureQueries } from "../../lib/communication/feature_queries";
import { GALLERY_DISABLED } from "../../lib/environment/derived_environment";

export async function setupGallery(): Promise<void> {
  if (GALLERY_DISABLED) {
    return;
  }

  if (ON_FAVORITES_PAGE) {
    await Events.favorites.favoritesFoundInDatabase.wait();
  }

  if (ON_SEARCH_PAGE) {
    await Events.searchPage.searchPageReady.wait();
  }
  finishGallerySetup();
}

function finishGallerySetup(): void {
  GalleryEdgeTapControls.setupGalleryMobileTapControls();
  GalleryInteractionTracker.setupGalleryInteractionTracker();
  GalleryVisibleThumbObserver.setupVisibleThumbObserver();
  GalleryAutoplaySetupFlow.setupAutoplay();
  GalleryView.setupGalleryView();
  addEventListeners();

  GalleryVisibleThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.presetAllCanvasDimensions();
}

function addEventListeners(): void {
  Events.gallery.visibleThumbsChanged.on(GalleryPreloadFlow.preloadVisibleThumbs);
  Events.gallery.videoEnded.on(GalleryAutoplayController.onVideoEnded);
  Events.gallery.videoDoubleClicked.on(GalleryStateFlow.exitGallery);
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);

  FeatureQueries.inGallery.register(GalleryModel.inGallery);

  if (ON_FAVORITES_PAGE) {
    Events.favorites.newFavoritesFound.on(GalleryContentFlow.indexThumbs, { once: true });
    Events.favorites.pageChanged.on(GalleryContentFlow.handlePageChange);
    Events.favorites.favoritesAddedToCurrentPage.on(GalleryContentFlow.handleNewContent);
    Events.favorites.showOnHoverToggled.on(GalleryModel.toggleShowingContentOnHover);
  }

  if (ON_SEARCH_PAGE) {
    Events.searchPage.upscaleToggled.on(GallerySearchPageFlow.onUpscaleToggled);
    Events.searchPage.searchPageCreated.on(GallerySearchPageFlow.onSearchPageCreated);
    Events.searchPage.moreResultsAdded.on(GallerySearchPageFlow.handleResultsAddedToSearchPage);
    Events.searchPage.infiniteScrollToggled.on(GalleryContentFlow.indexThumbs);
    Events.searchPage.pageChanged.on(GalleryContentFlow.handlePageChange);
  }

  if (ON_DESKTOP_DEVICE) {
    Events.document.mouseover.on(GalleryMouseOverFlow.onMouseOver);
    Events.document.click.on(GalleryClickFlow.onClick);
    Events.document.mousedown.on(GalleryClickFlow.onMouseDown);
    Events.document.contextmenu.on(GalleryClickFlow.onContextMenu);
    Events.document.mousemove.on(GalleryClickFlow.onMouseMove);
    Events.document.wheel.on(GalleryWheelFlow.onWheel);
    Events.document.keydown.on(GalleryKeyFlow.onKeyDown);
    Events.document.keyup.on(GalleryKeyFlow.onKeyUp);
    Events.gallery.interactionStopped.on(GalleryInteractionFlow.onInteractionStopped);
  } else {
    Events.gallery.leftTap.on(GalleryTouchFlow.onLeftTap);
    Events.gallery.rightTap.on(GalleryTouchFlow.onRightTap);
    Events.document.mousedown.on(GalleryTouchFlow.onMouseDown);
    Events.document.touchStart.on(GalleryTouchFlow.onTouchStart);
    Events.mobile.swipedDown.on(GallerySwipeFlow.onSwipeDown);
    Events.mobile.swipedUp.on(GalleryAutoplayController.showMenu);
    Events.window.orientationChange.on(GalleryView.correctOrientation);
  }
}
