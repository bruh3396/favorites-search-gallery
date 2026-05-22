import * as GalleryAutoplay from "./features/autoplay/autoplay";
import * as GalleryClickFlow from "./flows/click_flow";
import * as GalleryContentFlow from "./flows/content_flow";
import * as GalleryEdgeTapControls from "./control/edge_tap_controls";
import * as GalleryInteractionFlow from "./flows/interaction_flow";
import * as GalleryInteractionTracker from "./control/interaction_tracker";
import * as GalleryKeyFlow from "./flows/key_flow";
import * as GalleryMenuFlow from "./flows/menu_flow";
import * as GalleryModel from "./model/gallery_model";
import * as GalleryMouseOverFlow from "./flows/mouseover_flow";
import * as GalleryNavigationFlow from "./flows/navigation_flow";
import * as GalleryOpenCloseFlow from "./flows/open_close_flow";
import * as GalleryPreloadFlow from "./flows/preload_flow";
import * as GallerySearchPageFlow from "./flows/search_page_flow";
import * as GalleryTouchFlow from "./flows/touch_flow";
import * as GalleryView from "./view/gallery_view";
import * as GalleryVisibleThumbObserver from "./control/visible_thumb_observer";
import * as GalleryWheelFlow from "./flows/wheel_flow";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { DomEvents } from "../../app/input/dom_events";
import { Events } from "../../app/messaging/events";
import { FeatureBridge } from "../../app/messaging/feature_bridge";
import { GALLERY_DISABLED } from "../../app/state/feature_flags";
import { NavigationKey } from "../../types/input";
import { dispatchByState } from "./flows/state_dispatch";

export async function setupGallery(): Promise<void> {
  if (GALLERY_DISABLED) {
    return;
  }
  await waitUntilPageIsReady();
  setupView();
  setupControl();
  setupSubFeatures();
  subscribeToEvents();
  registerBridgeHandlers();
  primeInitialState();
}

async function waitUntilPageIsReady(): Promise<void> {
  if (ON_FAVORITES_PAGE) {
    await Events.favorites.favoritesFoundInDatabase.wait();
  }

  if (ON_SEARCH_PAGE) {
    await Events.searchPage.searchPageReady.wait();
  }
}

function setupView(): void {
  GalleryView.setup(
    Events.gallery.galleryMenuButtonClicked.emit,
    GalleryAutoplay.onVideoEnded,
    GalleryOpenCloseFlow.close
  );
}

function setupControl(): void {
  GalleryEdgeTapControls.setup();
  GalleryInteractionTracker.setup();
  GalleryVisibleThumbObserver.setup();
}

function setupSubFeatures(): void {
  setupAutoplay();
}

function setupAutoplay(): void {
  GalleryAutoplay.setup({
    setVideoLooping: GalleryView.toggleVideoLooping,
    onComplete: (direction?: NavigationKey) => dispatchByState({
      open: GalleryNavigationFlow.navigate
    }, direction),
    onVideoEndedBeforeMinimumViewTime: () => GalleryView.restartVideo()
  });
  Events.gallery.openedGallery.on(GalleryAutoplay.startAutoplay);
  Events.gallery.closedGallery.on(GalleryAutoplay.stopAutoplay);
  Events.gallery.displayedThumb.on(GalleryAutoplay.startViewTimer);
}

function subscribeToEvents(): void {
  Events.gallery.visibleThumbsChanged.on(GalleryPreloadFlow.preloadVisibleThumbs);
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);

  if (ON_FAVORITES_PAGE) {
    subscribeToFavoritesEvents();
  }

  if (ON_SEARCH_PAGE) {
    subscribeToSearchPageEvents();
  }

  if (ON_DESKTOP_DEVICE) {
    subscribeToDesktopInput();
  } else {
    subscribeToMobileInput();
  }
}

function subscribeToFavoritesEvents(): void {
  Events.favorites.newFavoritesFound.on(GalleryContentFlow.indexThumbs, { once: true });
  Events.favorites.pageChanged.on(GalleryContentFlow.handlePageChange);
  Events.favorites.favoritesAddedToCurrentPage.on(GalleryContentFlow.handleNewContent);
  Events.favorites.showOnHoverToggled.on(GalleryModel.toggleEnlargeOnHover);
}

function subscribeToSearchPageEvents(): void {
  Events.searchPage.upscaleToggled.on(GallerySearchPageFlow.onUpscaleToggled);
  Events.searchPage.searchPageCreated.on(GallerySearchPageFlow.onSearchPageCreated);
  Events.searchPage.moreResultsAdded.on(GallerySearchPageFlow.handleResultsAddedToSearchPage);
  Events.searchPage.infiniteScrollToggled.on(GalleryContentFlow.indexThumbs);
  Events.searchPage.pageChanged.on(GalleryContentFlow.handlePageChange);
}

function subscribeToDesktopInput(): void {
  DomEvents.document.mouseover.on(GalleryMouseOverFlow.onMouseOver);
  DomEvents.document.mouseover.on(GalleryView.onDesktopMenuMouseOver);
  DomEvents.document.click.on(GalleryClickFlow.onClick);
  DomEvents.document.mousedown.on(GalleryClickFlow.onMouseDown);
  DomEvents.document.contextmenu.on(GalleryClickFlow.onContextMenu);
  DomEvents.document.mousemove.on(GalleryClickFlow.onMouseMove);
  DomEvents.document.mousemove.on(GalleryView.onDesktopMenuMouseMove);
  DomEvents.document.wheel.on(GalleryWheelFlow.onWheel);
  DomEvents.document.keydown.on(GalleryKeyFlow.onKeyDown);
  DomEvents.document.keyup.on(GalleryKeyFlow.onKeyUp);
  Events.gallery.interactionStopped.on(GalleryInteractionFlow.onInteractionStopped);
}

function subscribeToMobileInput(): void {
  Events.gallery.leftTap.on(GalleryTouchFlow.onLeftTap);
  Events.gallery.rightTap.on(GalleryTouchFlow.onRightTap);
  DomEvents.document.mousedown.on(GalleryTouchFlow.onMouseDown);
  DomEvents.document.touchStart.on(GalleryTouchFlow.onTouchStart);
  Events.mobile.swipedDown.on(GalleryTouchFlow.onSwipeDown);
  Events.mobile.swipedUp.on(GalleryAutoplay.showMenu);
  DomEvents.window.orientationChange.on(GalleryView.correctOrientation);
}

function registerBridgeHandlers(): void {
  FeatureBridge.inGallery.register(GalleryModel.isInGallery);
}

function primeInitialState(): void {
  GalleryVisibleThumbObserver.observeAllThumbsOnPage();
  GalleryModel.reIndexThumbs();
}
