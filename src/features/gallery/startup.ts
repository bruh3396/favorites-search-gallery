import * as GalleryControl from "@/features/gallery/control/control";
import * as GalleryFeatures from "@/features/gallery/features/features";
import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { hideTutorial, showTutorial } from "@/features/gallery/dom_tweaks/tutorial";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

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
  if (ON_FAVORITES_PAGE) {
    GalleryModel.setup(id => GalleryModel.wrappingThumbsAroundId(FeatureBridge.favorites.searchResults.call(), id, favorite => favorite.root));
  } else {
    GalleryModel.setup(id => GalleryModel.clampedThumbsAroundId(FeatureBridge.postList.thumbs.call(), id, thumb => thumb));
  }
}

async function start(): Promise<void> {
  if (ON_POST_LIST_PAGE) {
    GalleryFlows.Content.refresh();
    return;
  }

  if (ON_FAVORITES_PAGE && !(await hasStoredFavorites())) {
    GalleryFlows.Content.refresh();
  }
}

function hasStoredFavorites(): Promise<boolean> {
  return Events.favorites.storedFavoritesFound.wait();
}

function setupView(): void {
  GalleryView.setup({
    onMenuAction: Events.gallery.galleryMenuButtonClicked.emit,
    onVideoEnded: GalleryFeatures.handleVideoEnded,
    onVideoDoubleClicked: GalleryFlows.OpenClose.close,
    onVolumeChanged: GalleryFlows.Video.setVolume
  });
}

function setupControl(): void {
  GalleryControl.setup(GalleryFlows.Visibility.handleVisibleThumbsChanged);
}

function setupSubFeatures(): void {
  GalleryFeatures.setup({
    autoplay: {
      setVideoLooping: GalleryView.toggleVideoLooping,
      onComplete: (direction?: NavigationKey) => GalleryFlows.Dispatch.run({
        open: GalleryFlows.Navigation.navigate
      }, direction),
      onVideoEndedBeforeMinimumViewTime: () => GalleryView.restartVideo(),
      subscribeToMouseMove: DomEvents.document.mousemove.on,
      subscribeToKeyDown: DomEvents.document.keydown.on
    }
  });
}

function subscribeToEvents(): void {
  Events.gallery.galleryMenuButtonClicked.on(GalleryFlows.Menu.handleAction);
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
  Events.favorites.contentReplaced.on(GalleryFlows.Content.refresh);
  Events.favorites.contentAdded.on(GalleryFlows.Content.refresh);
  Preferences.gallery.previewEnabled.on(GalleryModel.preview);
  Events.favorites.searchResultsUpdated.on(GalleryFlows.Content.downscaleThumbsOutsideResults);
}

function subscribeToPostListEvents(): void {
  Preferences.postList.upscaleThumbs.on(GalleryFlows.PostList.toggleUpscaling);
  Events.postList.initialPostListCreated.on(GalleryFlows.PostList.preloadOnIdle, { once: true });
  Events.postList.moreResultsAdded.on(GalleryFlows.Content.refresh);
  Preferences.postList.infiniteScroll.on(GalleryFlows.Content.refresh);
  Events.postList.pageChanged.on(GalleryFlows.Content.refresh);
}

function subscribeToDesktopInput(): void {
  DomEvents.document.mouseover.on(GalleryFlows.MouseOver.handleMouseOver);
  DomEvents.document.mouseover.on(GalleryView.toggleMenuPersistence);
  DomEvents.document.click.on(GalleryFlows.Click.handleClick);
  DomEvents.document.mousedown.on(GalleryFlows.Click.handleMouseDown);
  DomEvents.document.contextmenu.on(GalleryFlows.Click.handleContextMenu);
  DomEvents.document.mousemove.on(GalleryFlows.Interaction.showCursorInGallery);
  DomEvents.document.mousemove.on(GalleryView.revealMenu);
  DomEvents.document.wheel.on(GalleryFlows.Wheel.handleWheel);
  DomEvents.document.keydown.on(GalleryFlows.Key.handleKeyDown);
  DomEvents.document.keyup.on(GalleryFlows.Key.handleKeyUp);
  Events.gallery.interactionStopped.on(GalleryFlows.Interaction.hideCursorInGallery);
}

function subscribeToMobileInput(): void {
  Events.gallery.leftTap.on(GalleryFlows.Touch.navigateBackInGallery);
  Events.gallery.rightTap.on(GalleryFlows.Touch.navigateForwardInGallery);
  DomEvents.document.mousedown.on(GalleryFlows.Touch.handleMouseDown);
  DomEvents.document.touchStart.on(GalleryFlows.Touch.handleTouchStart);
  DomEvents.mobile.swipedDown.on(GalleryFlows.Touch.closeGallery);
  DomEvents.mobile.swipedUp.on(GalleryFeatures.showMenu);
  DomEvents.mobile.touchHold.on(GalleryFlows.Touch.favoriteCurrentPost);
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
