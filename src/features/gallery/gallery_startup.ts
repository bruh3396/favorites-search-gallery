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
import * as GalleryVideoFlow from "@/features/gallery/flows/video_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import * as GalleryVisibilityFlow from "@/features/gallery/flows/visibility_flow";
import * as GalleryWheelFlow from "@/features/gallery/flows/wheel_flow";
import * as MediaResolver from "@/lib/media/resolver";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { hideTutorial, showTutorial } from "@/features/gallery/dom_tweaks/tutorial";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
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
    await Events.favorites.storedFavoritesFound.wait();
  }

  if (ON_POST_LIST_PAGE) {
    await Events.postList.postListInitialized.wait();
  }
}

function setup(): void {
  setupSubFeatures();
  setupModel();
  setupView();
  setupControl();
  subscribeToEvents();
  serveExternalRequests();
}

function setupModel(): void {
  const getFavoriteThumbs = (): HTMLElement[] => FeatureBridge.favorites.searchResults.call().map(favorite => favorite.root);
  const getPostListThumbs = (): HTMLElement[] => FeatureBridge.postList.thumbs.call();

  GalleryModel.setup(ON_FAVORITES_PAGE ? getFavoriteThumbs : getPostListThumbs, ON_FAVORITES_PAGE);
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
  return Events.favorites.storedFavoritesFound.wait();
}

function setupView(): void {
  GalleryView.setup({
    onMenuAction: Events.gallery.galleryMenuButtonClicked.emit,
    onVideoEnded: GalleryAutoplay.handleVideoEnded,
    onVideoDoubleClicked: GalleryOpenCloseFlow.close,
    onVolumeChanged: GalleryVideoFlow.setVolume
  });
}

function setupControl(): void {
  GalleryEdgeTapControls.setup();
  GalleryInteractionTracker.setup();
  GalleryThumbObserver.setup(GalleryVisibilityFlow.handleVisibleThumbsChanged);
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
  Preferences.gallery.autoplayActive.on(GalleryAutoplay.toggle);
  Events.gallery.openedGallery.on(GalleryAutoplay.startAutoplay);
  Events.gallery.closedGallery.on(GalleryAutoplay.stopAutoplay);
  Events.gallery.displayedThumb.on(GalleryAutoplay.startViewTimer);
}

function subscribeToEvents(): void {
  Events.gallery.galleryMenuButtonClicked.on(GalleryMenuFlow.handleAction);
  Preferences.gallery.backgroundOpacity.on(GalleryView.setBackgroundOpacity);
  Preferences.gallery.menuPinned.on(GalleryView.setMenuPinned);
  Preferences.gallery.menuDockedLeft.on(GalleryView.setMenuDockedLeft);
  Preferences.gallery.videoMuted.on(GalleryView.setVideoMuted);

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
  Events.favorites.contentReplaced.on(GalleryContentFlow.refresh);
  Events.favorites.contentAdded.on(GalleryContentFlow.refresh);
  Preferences.gallery.previewEnabled.on(GalleryModel.preview);
  Events.favorites.searchResultsUpdated.on(GalleryContentFlow.downscaleThumbsOutsideResults);
  Events.favorites.searchResultsUpdated.on(warmExtensionCache, { once: true });
}

async function warmExtensionCache(favorites: Favorite[]): Promise<void> {
  if (await hasStoredFavorites()) {
    MediaResolver.cacheExtensions(favorites.slice(0, 50).map(favorite => favorite.id));
  }
}

function subscribeToPostListEvents(): void {
  Preferences.postList.upscaleThumbs.on(GalleryPostListFlow.toggleUpscaling);
  Events.postList.initialPostListCreated.on(GalleryPostListFlow.preloadOnIdle, { once: true });
  Events.postList.moreResultsAdded.on(GalleryContentFlow.refresh);
  Preferences.postList.infiniteScroll.on(GalleryContentFlow.refresh);
  Events.postList.pageChanged.on(GalleryContentFlow.refresh);
}

function subscribeToDesktopInput(): void {
  DomEvents.document.mouseover.on(GalleryMouseOverFlow.handleMouseOver);
  DomEvents.document.mouseover.on(GalleryView.toggleMenuPersistence);
  DomEvents.document.click.on(GalleryClickFlow.handleClick);
  DomEvents.document.mousedown.on(GalleryClickFlow.handleMouseDown);
  DomEvents.document.contextmenu.on(GalleryClickFlow.handleContextMenu);
  DomEvents.document.mousemove.on(GalleryInteractionFlow.showCursorInGallery);
  DomEvents.document.mousemove.on(GalleryView.revealMenu);
  DomEvents.document.wheel.on(GalleryWheelFlow.handleWheel);
  DomEvents.document.keydown.on(GalleryKeyFlow.handleKeyDown);
  DomEvents.document.keyup.on(GalleryKeyFlow.handleKeyUp);
  Events.gallery.interactionStopped.on(GalleryInteractionFlow.hideCursorInGallery);
}

function subscribeToMobileInput(): void {
  Events.gallery.leftTap.on(GalleryTouchFlow.navigateBackInGallery);
  Events.gallery.rightTap.on(GalleryTouchFlow.navigateForwardInGallery);
  DomEvents.document.mousedown.on(GalleryTouchFlow.handleMouseDown);
  DomEvents.document.touchStart.on(GalleryTouchFlow.handleTouchStart);
  DomEvents.mobile.swipedDown.on(GalleryTouchFlow.closeGallery);
  DomEvents.mobile.swipedUp.on(GalleryAutoplay.showMenu);
  DomEvents.window.orientationChange.on(GalleryView.correctOrientation);
  Events.gallery.openedGallery.on(showTutorialOnFirstOpen, { once: true });
  Events.gallery.showControlsRequested.on(showTutorial);
  Events.gallery.closedGallery.on(hideTutorial);
}

function showTutorialOnFirstOpen(): void {
  if (!Preferences.gallery.tutorialSeen.value) {
    Preferences.gallery.tutorialSeen.set(true);
    showTutorial();
  }
}

function serveExternalRequests(): void {
  FeatureBridge.gallery.state.serve(GalleryModel.getCurrentState);
  FeatureBridge.gallery.currentThumb.serve(GalleryModel.currentThumbIfOpen);
}
