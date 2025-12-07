import * as GalleryAutoplayController from "../../autoplay/gallery_autoplay_controller";
import * as GalleryContentFlow from "../flows/runtime/gallery_content_flow";
import * as GalleryFavoritesFlow from "../flows/runtime/gallery_favorites_flow";
import * as GalleryKeyFlow from "../flows/runtime/gallery_key_flow";
import * as GalleryMenuFlow from "../flows/runtime/gallery_menu_flow";
import * as GalleryModel from "../../model/gallery_model";
import * as GalleryMouseFlow from "../flows/runtime/gallery_mouse_flow";
import * as GalleryPreloadFlow from "../flows/runtime/gallery_preload_flow";
import * as GallerySearchPageFlow from "../flows/runtime/gallery_search_page_flow";
import * as GalleryStateFlow from "../flows/runtime/gallery_state_flow";
import * as GallerySwipeFlow from "../flows/runtime/gallery_swipe_flow";
import * as GalleryTouchFlow from "../flows/runtime/gallery_touch_flow";
import * as GalleryView from "../../view/gallery_view";
import { CrossFeatureRequests } from "../../../../lib/global/cross_feature_requests";
import { Events } from "../../../../lib/global/events/events";
import { ON_DESKTOP_DEVICE } from "../../../../lib/global/flags/intrinsic_flags";

export function addGalleryEventListeners(): void {
  addFavoritesEventListeners();
  addGalleryEventListeners2();
  addPlatformDependentEventListeners();
  addSearchPageEventListeners();
  addCrossFeatureRequestHandlers();
}

function addFavoritesEventListeners(): void {
  Events.favorites.newFavoritesFoundOnReload.on(GalleryFavoritesFlow.handleNewFavoritesFoundOnReload, { once: true });
  Events.favorites.pageChanged.on(GalleryContentFlow.handlePageChange);
  Events.favorites.favoritesAddedToCurrentPage.on(GalleryFavoritesFlow.handleFavoritesAddedToCurrentPage);
  Events.favorites.showOnHoverToggled.on(GalleryModel.toggleShowContentOnHover);
}

function addGalleryEventListeners2(): void {
  Events.gallery.visibleThumbsChanged.on(GalleryPreloadFlow.preloadVisibleContent);
  Events.gallery.videoEnded.on(GalleryAutoplayController.onVideoEnded);
  Events.gallery.videoDoubleClicked.on(GalleryStateFlow.exitGallery);
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);
}

function addSearchPageEventListeners(): void {
  Events.searchPage.upscaleToggled.on(GallerySearchPageFlow.onUpscaleToggled);
  Events.searchPage.searchPageCreated.on(GallerySearchPageFlow.onSearchPageCreated);
  Events.searchPage.moreResultsAdded.on(GallerySearchPageFlow.handleResultsAddedToSearchPage);
  Events.searchPage.infiniteScrollToggled.on(GalleryContentFlow.reIndexThumbs);
  Events.searchPage.pageChanged.on(GalleryContentFlow.handlePageChange);
}

function addCrossFeatureRequestHandlers(): void {
  CrossFeatureRequests.inGallery.setHandler(GalleryModel.inGallery);
}

function addPlatformDependentEventListeners(): void {
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
