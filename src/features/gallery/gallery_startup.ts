import * as GalleryAutoplay from "@/features/gallery/features/autoplay/autoplay";
import * as GalleryClickFlow from "@/features/gallery/flows/click_flow";
import * as GalleryContentFlow from "@/features/gallery/flows/content_flow";
import * as GalleryEdgeTapControls from "@/features/gallery/control/edge_tap_controls";
import * as GalleryInteractionFlow from "@/features/gallery/flows/interaction_flow";
import * as GalleryInteractionTracker from "@/features/gallery/control/interaction_tracker";
import * as GalleryKeyFlow from "@/features/gallery/flows/key_flow";
import * as GalleryMenuFlow from "@/features/gallery/flows/menu_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryMouseOverFlow from "@/features/gallery/flows/mouseover_flow";
import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import * as GalleryPostListFlow from "@/features/gallery/flows/post_list_flow";
import * as GalleryThumbObserver from "@/features/gallery/control/thumb_observer";
import * as GalleryTouchFlow from "@/features/gallery/flows/touch_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import * as GalleryVisibilityFlow from "@/features/gallery/flows/visibility_flow";
import * as GalleryWheelFlow from "@/features/gallery/flows/wheel_flow";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { NavigationKey } from "@/types/input";
import { run } from "@/features/gallery/flows/dispatch";

export async function startGallery(): Promise<void> {
  if (GALLERY_DISABLED) {
    return;
  }
  await waitUntilPageIsReady();
  setup();
  start();
}

async function waitUntilPageIsReady(): Promise<void> {
  if (ON_FAVORITES_PAGE) {
    await Events.favorites.favoritesFoundInDatabase.wait();
  }

  if (ON_POST_LIST_PAGE) {
    await Events.postList.postListInitialized.wait();
  }
}

function setup(): void {
  setupModel();
  setupView();
  setupControl();
  setupSubFeatures();
  subscribeToEvents();
  serveExternalRequests();
}

function setupModel(): void {
  const getFavoriteThumbs = (): HTMLElement[] => FeatureBridge.favoritesSearchResults.call().map(favorite => favorite.root);
  const getPostListThumbs = (): HTMLElement[] => FeatureBridge.postListThumbs.call();

  GalleryModel.setupNeighbors(ON_FAVORITES_PAGE ? getFavoriteThumbs : getPostListThumbs);
}

async function start(): Promise<void> {
  if (ON_POST_LIST_PAGE) {
    GalleryContentFlow.refresh();
    return;
  }

  if (ON_FAVORITES_PAGE && !(await hasStoredFavorites())) {
    GalleryContentFlow.refresh();
  }
}

function hasStoredFavorites(): Promise<boolean> {
  return Events.favorites.favoritesFoundInDatabase.wait();
}

function setupView(): void {
  GalleryView.setup({
    onMenuAction: Events.gallery.galleryMenuButtonClicked.emit,
    onVideoEnded: GalleryAutoplay.onVideoEnded,
    onVideoDoubleClicked: GalleryOpenCloseFlow.close
  });
}

function setupControl(): void {
  GalleryEdgeTapControls.setup();
  GalleryInteractionTracker.setup();
  GalleryThumbObserver.setup(GalleryVisibilityFlow.onVisibleThumbsChanged);
}

function setupSubFeatures(): void {
  setupAutoplay();
}

function setupAutoplay(): void {
  GalleryAutoplay.setup({
    setVideoLooping: GalleryView.toggleVideoLooping,
    onComplete: (direction?: NavigationKey) => run({
      open: GalleryNavigationFlow.navigate
    }, direction),
    onVideoEndedBeforeMinimumViewTime: () => GalleryView.restartVideo(),
    subscribeToMouseMove: DomEvents.document.mousemove.on,
    subscribeToKeyDown: DomEvents.document.keydown.on
  });
  Events.app.autoplayToggled.on(GalleryAutoplay.toggle);
  Events.gallery.openedGallery.on(GalleryAutoplay.startAutoplay);
  Events.gallery.closedGallery.on(GalleryAutoplay.stopAutoplay);
  Events.gallery.displayedThumb.on(GalleryAutoplay.startViewTimer);
}

function subscribeToEvents(): void {
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.onGalleryMenuAction);

  if (ON_FAVORITES_PAGE) {
    subscribeToFavoritesEvents();
  }

  if (ON_POST_LIST_PAGE) {
    subscribeToPostListEvents();
  }

  if (ON_DESKTOP_DEVICE) {
    subscribeToDesktopInput();
  } else {
    subscribeToMobileInput();
  }
}

function subscribeToFavoritesEvents(): void {
  Events.favorites.newFavoritesFound.on(GalleryContentFlow.refresh, { once: true });
  Events.favorites.pageChanged.on(GalleryContentFlow.refresh);
  Events.favorites.favoritesAddedToCurrentPage.on(GalleryContentFlow.reIndex);
  Events.favorites.galleryPreviewToggled.on(GalleryModel.togglePreview);
  Events.favorites.searchResultsUpdated.on(GalleryContentFlow.downscaleThumbsOutsideResults);
}

function subscribeToPostListEvents(): void {
  Events.postList.upscaleToggled.on(GalleryPostListFlow.onUpscaleToggled);
  Events.postList.initialPostListCreated.on(GalleryPostListFlow.onInitialPostListCreated, { once: true });
  Events.postList.moreResultsAdded.on(GalleryContentFlow.refresh);
  Events.postList.infiniteScrollToggled.on(GalleryContentFlow.refresh);
  Events.postList.pageChanged.on(GalleryContentFlow.refresh);
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
  DomEvents.mobile.swipedDown.on(GalleryTouchFlow.onSwipeDown);
  DomEvents.mobile.swipedUp.on(GalleryAutoplay.showMenu);
  DomEvents.window.orientationChange.on(GalleryView.correctOrientation);
}

function serveExternalRequests(): void {
  FeatureBridge.galleryState.register(GalleryModel.getCurrentState);
  FeatureBridge.currentGalleryThumb.register(GalleryModel.currentThumbIfOpen);
}
