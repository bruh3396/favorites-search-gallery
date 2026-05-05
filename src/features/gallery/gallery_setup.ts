import * as GalleryAutoplayController from "./features/autoplay/autoplay_controller";
import * as GalleryClickFlow from "./flow/click_flow";
import * as GalleryContentFlow from "./flow/content_flow";
import * as GalleryEdgeTapControls from "./control/edge_tap_controls";
import * as GalleryInteractionFlow from "./flow/interaction_flow";
import * as GalleryInteractionTracker from "./control/interaction_tracker";
import * as GalleryKeyFlow from "./flow/key_flow";
import * as GalleryMenuFlow from "./flow/menu_flow";
import * as GalleryModel from "./model/model";
import * as GalleryMouseOverFlow from "./flow/mouseover_flow";
import * as GalleryNavigationFlow from "./flow/navigation_flow";
import * as GalleryPreloadFlow from "./flow/preload_flow";
import * as GallerySearchPageFlow from "./flow/search_page_flow";
import * as GalleryStateFlow from "./flow/state_flow";
import * as GallerySwipeFlow from "./flow/swipe_flow";
import * as GalleryTouchFlow from "./flow/touch_flow";
import * as GalleryView from "./view/gallery_view";
import * as GalleryVisibleThumbObserver from "./control/visible_thumb_observer";
import * as GalleryWheelFlow from "./flow/wheel_flow";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { Events } from "../../lib/communication/events";
import { FeatureQueries } from "../../lib/communication/feature_queries";
import { GALLERY_DISABLED } from "../../lib/environment/derived_environment";
import { NavigationKey } from "../../types/input";
import { executeByGalleryState } from "./flow/state_executor";

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
  setupAutoplay();
  GalleryView.setupGalleryView();
  addEventListeners();
  GalleryVisibleThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.presetAllCanvasDimensions();
}

function setupAutoplay(): void {
  GalleryAutoplayController.setupAutoplay({
    onEnable: () => GalleryView.toggleVideoLooping(false),
    onDisable: () => GalleryView.toggleVideoLooping(true),
    onPause: () => GalleryView.toggleVideoLooping(true),
    onResume: () => GalleryView.toggleVideoLooping(false),
    onComplete: (direction?: NavigationKey) => executeByGalleryState({ gallery: GalleryNavigationFlow.navigate }, direction),
    onVideoEndedBeforeMinimumViewTime: () => GalleryView.restartVideo()
  });
  GalleryView.toggleVideoLooping(GalleryAutoplayController.isPaused() || !GalleryAutoplayController.isActive());
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
