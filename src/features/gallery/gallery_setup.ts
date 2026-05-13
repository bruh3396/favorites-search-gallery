import * as GalleryAutoplay from "./features/autoplay/autoplay";
import * as GalleryClickFlow from "./flows/click_flow";
import * as GalleryContentFlow from "./flows/content_flow";
import * as GalleryControl from "./control/gallery_control";
import * as GalleryInteractionFlow from "./flows/interaction_flow";
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
import { DomEvents } from "../../lib/communication/dom_events";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { GALLERY_DISABLED } from "../../lib/environment/derived_environment";
import { NavigationKey } from "../../types/input";
import { dispatchByState } from "./flows/state_dispatch";

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
  GalleryView.setup({
    onMenuAction: (action) => Events.gallery.galleryMenuButtonClicked.emit(action)
  });
  GalleryView.setupVideoRenderer({
    onVideoEnded: GalleryAutoplay.onVideoEnded,
    onVideoDoubleClicked: GalleryOpenCloseFlow.close
  });
  GalleryControl.setup();
  setupSubFeatures();
  addEventListeners();
  GalleryVisibleThumbObserver.observeAllThumbsOnPage();
  GalleryModel.refreshThumbs();
  GalleryView.presetAllCanvasDimensions();
}

function setupSubFeatures(): void {
  GalleryAutoplay.setup({
    onEnable: () => GalleryView.toggleVideoLooping(false),
    onDisable: () => GalleryView.toggleVideoLooping(true),
    onPause: () => GalleryView.toggleVideoLooping(true),
    onResume: () => GalleryView.toggleVideoLooping(false),
    onComplete: (direction?: NavigationKey) => dispatchByState({
        open: GalleryNavigationFlow.navigate
      }, direction),
    onVideoEndedBeforeMinimumViewTime: () => GalleryView.restartVideo()
  });
  GalleryView.toggleVideoLooping(GalleryAutoplay.isPaused() || !GalleryAutoplay.isActive());
  Events.gallery.openedGallery.on(GalleryAutoplay.startAutoplay);
  Events.gallery.closedGallery.on(GalleryAutoplay.stopAutoplay);
  Events.gallery.displayedThumb.on(GalleryAutoplay.startViewTimer);
}

function addEventListeners(): void {
  Events.gallery.visibleThumbsChanged.on(GalleryPreloadFlow.preloadVisibleThumbs);
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);

  FeatureBridge.inGallery.register(GalleryModel.isInGallery);

  if (ON_FAVORITES_PAGE) {
    Events.favorites.newFavoritesFound.on(GalleryContentFlow.indexThumbs, { once: true });
    Events.favorites.pageChanged.on(GalleryContentFlow.handlePageChange);
    Events.favorites.favoritesAddedToCurrentPage.on(GalleryContentFlow.handleNewContent);
    Events.favorites.showOnHoverToggled.on(GalleryModel.toggleEnlargeOnHover);
  }

  if (ON_SEARCH_PAGE) {
    Events.searchPage.upscaleToggled.on(GallerySearchPageFlow.onUpscaleToggled);
    Events.searchPage.searchPageCreated.on(GallerySearchPageFlow.onSearchPageCreated);
    Events.searchPage.moreResultsAdded.on(GallerySearchPageFlow.handleResultsAddedToSearchPage);
    Events.searchPage.infiniteScrollToggled.on(GalleryContentFlow.indexThumbs);
    Events.searchPage.pageChanged.on(GalleryContentFlow.handlePageChange);
  }

  if (ON_DESKTOP_DEVICE) {
    DomEvents.document.mouseover.on(GalleryMouseOverFlow.onMouseOver);
    DomEvents.document.mouseover.on((e) => GalleryView.onDesktopMenuMouseOver(e.originalEvent));
    DomEvents.document.click.on(GalleryClickFlow.onClick);
    DomEvents.document.mousedown.on(GalleryClickFlow.onMouseDown);
    DomEvents.document.contextmenu.on(GalleryClickFlow.onContextMenu);
    DomEvents.document.mousemove.on(GalleryClickFlow.onMouseMove);
    DomEvents.document.mousemove.on(GalleryView.onDesktopMenuMouseMove);
    DomEvents.document.wheel.on(GalleryWheelFlow.onWheel);
    DomEvents.document.keydown.on(GalleryKeyFlow.onKeyDown);
    DomEvents.document.keyup.on(GalleryKeyFlow.onKeyUp);
    Events.gallery.interactionStopped.on(GalleryInteractionFlow.onInteractionStopped);
  } else {
    Events.gallery.leftTap.on(GalleryTouchFlow.onLeftTap);
    Events.gallery.rightTap.on(GalleryTouchFlow.onRightTap);
    DomEvents.document.mousedown.on(GalleryTouchFlow.onMouseDown);
    DomEvents.document.touchStart.on(GalleryTouchFlow.onTouchStart);
    Events.mobile.swipedDown.on(GalleryTouchFlow.onSwipeDown);
    Events.mobile.swipedUp.on(GalleryAutoplay.showMenu);
    DomEvents.window.orientationChange.on(GalleryView.correctOrientation);
  }
}
