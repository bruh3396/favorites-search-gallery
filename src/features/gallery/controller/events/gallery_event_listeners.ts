import * as GalleryAutoplayController from "../../autoplay/gallery_autoplay_controller";
import * as GalleryFavoritesFlow from "../flows/runtime/gallery_favorites_flow";
import * as GalleryKeyFlow from "../flows/runtime/gallery_key_flow";
import * as GalleryMenuFlow from "../flows/runtime/gallery_menu_flow";
import * as GalleryModel from "../../model/gallery_model";
import * as GalleryMouseFlow from "../flows/runtime/gallery_mouse_flow";
import * as GalleryPreloadFlow from "../flows/runtime/gallery_preload_flow";
import * as GalleryStateFlow from "../flows/runtime/gallery_state_flow";
import * as GallerySwipeFlow from "../flows/runtime/gallery_swipe_flow";
import * as GalleryTouchFlow from "../flows/runtime/gallery_touch_flow";
import * as GalleryView from "../../view/gallery_view";
import { Events } from "../../../../lib/globals/events";
import { ON_DESKTOP_DEVICE } from "../../../../lib/globals/flags";

export function addGalleryEventListeners(): void {
  Events.favorites.newFavoritesFoundOnReload.on(GalleryFavoritesFlow.handleNewFavoritesFoundOnReload, { once: true });

  Events.favorites.pageChanged.on(GalleryFavoritesFlow.handlePageChange);
  Events.favorites.resultsAddedToCurrentPage.on(GalleryFavoritesFlow.handleResultsAddedToCurrentPage);
  Events.favorites.searchResultsUpdated.on(GalleryModel.setSearchResults);
  Events.favorites.showOnHoverToggled.on(GalleryModel.toggleShowContentOnHover);
  Events.favorites.inGalleryRequest.on(GalleryFavoritesFlow.inGalleryResponse);

  Events.gallery.visibleThumbsChanged.on(GalleryPreloadFlow.preloadVisibleContent);
  Events.gallery.videoEnded.on(GalleryAutoplayController.onVideoEnded);
  Events.gallery.videoDoubleClicked.on(GalleryStateFlow.exitGallery);

  addPlatformDependentEventListeners();

  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);
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
  Events.gallery.swipedDown.on(GallerySwipeFlow.onSwipeDown);
  Events.gallery.swipedUp.on(GalleryAutoplayController.showMenu);
  Events.window.orientationChange.on(GalleryView.correctOrientation);
}
