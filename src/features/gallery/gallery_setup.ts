import * as GalleryAutoplayController from "./features/autoplay/autoplay_controller";
import * as GalleryClickFlow from "./flows/click_flow";
import * as GalleryContentFlow from "./flows/content_flow";
import * as GalleryControl from "./control/gallery_control";
import * as GalleryInteractionFlow from "./flows/interaction_flow";
import * as GalleryKeyFlow from "./flows/key_flow";
import * as GalleryMenuFlow from "./flows/menu_flow";
import * as GalleryModel from "./model/gallery_model";
import * as GalleryMouseOverFlow from "./flows/mouseover_flow";
import * as GalleryNavigationFlow from "./flows/navigation_flow";
import * as GalleryPreloadFlow from "./flows/preload_flow";
import * as GallerySearchPageFlow from "./flows/search_page_flow";
import * as GalleryStateFlow from "./flows/state_flow";
import * as GallerySwipeFlow from "./flows/swipe_flow";
import * as GalleryTouchFlow from "./flows/touch_flow";
import * as GalleryView from "./view/gallery_view";
import * as GalleryVisibleThumbObserver from "./control/visible_thumb_observer";
import * as GalleryWheelFlow from "./flows/wheel_flow";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { Events } from "../../lib/communication/events";
import { FeatureQueries } from "../../lib/communication/feature_queries";
import { GALLERY_DISABLED } from "../../lib/environment/derived_environment";
import { NavigationKey } from "../../types/input";
import { executeByGalleryState } from "./flows/state_executor";

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
  GalleryView.setupGalleryView();
  GalleryControl.setupGalleryControl();
  setupSubFeatures();
  addEventListeners();
  GalleryVisibleThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.presetAllCanvasDimensions();
}

function setupSubFeatures(): void {
  GalleryAutoplayController.setupAutoplay({
    onEnable: () => GalleryView.toggleVideoLooping(false),
    onDisable: () => GalleryView.toggleVideoLooping(true),
    onPause: () => GalleryView.toggleVideoLooping(true),
    onResume: () => GalleryView.toggleVideoLooping(false),
    onComplete: (direction?: NavigationKey) => executeByGalleryState({ gallery: GalleryNavigationFlow.navigate }, direction),
    onVideoEndedBeforeMinimumViewTime: () => GalleryView.restartVideo()
  });
  GalleryView.toggleVideoLooping(GalleryAutoplayController.isPaused() || !GalleryAutoplayController.isActive());
  Events.gallery.enteredGallery.on(GalleryAutoplayController.startAutoplay);
  Events.gallery.exitedGallery.on(GalleryAutoplayController.stopAutoplay);
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
