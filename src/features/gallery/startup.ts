import { hideTutorial, showTutorial } from "@/features/gallery/dom_tweaks/tutorial";
import { AppContext } from "@/app/context/context";
import { GalleryComponents } from "@/features/gallery/types/types";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryFeatures } from "@/features/gallery/features/features";
import { GalleryFlows } from "@/features/gallery/flows/flows";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryView } from "@/features/gallery/view/view";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

export async function startGallery(context: AppContext): Promise<void> {
  if (context.flags.galleryDisabled) {
    return;
  }
  await waitUntilPageIsReady(context);

  const model = new GalleryModel(context.preferences);
  const view = new GalleryView(context);
  const control = new GalleryControl(context, view);
  const flows = new GalleryFlows(context, model, view, control);
  const features = new GalleryFeatures(context);
  const components: GalleryComponents = { context, model, view, control, flows, features };

  setup(components);
  start(components);
}

async function waitUntilPageIsReady(context: AppContext): Promise<void> {
  const { environment, events } = context;

  if (environment.onFavoritesPage) {
    await events.favorites.storedFavoritesFound.wait();
  }

  if (environment.onPostListPage) {
    await events.postList.postListInitialized.wait();
  }
}

function setup(components: GalleryComponents): void {
  setupModel(components);
  setupView(components);
  setupSubFeatures(components);
  setupControl(components);
  subscribeToEvents(components);
  serveExternalRequests(components);
}

async function start(components: GalleryComponents): Promise<void> {
  const { context, flows } = components;
  const { environment } = context;

  if (environment.onPostListPage) {
    flows.content.refresh();
    return;
  }

  if (environment.onFavoritesPage && !(await hasStoredFavorites(context))) {
    flows.content.refresh();
  }
}

function hasStoredFavorites(context: AppContext): Promise<boolean> {
  return context.events.favorites.storedFavoritesFound.wait();
}

function setupModel({ context, model }: GalleryComponents): void {
  const { environment, featureBridge } = context;

  if (environment.onFavoritesPage) {
    model.setupWrappingWindow(() => featureBridge.favorites.searchResults.call(), (favorite) => favorite.root);
  } else {
    model.setupClampedWindow(() => featureBridge.postList.thumbs.call(), (thumb) => thumb);
  }
}

function setupView({ context, view, flows, features }: GalleryComponents): void {
  view.setup({
    onMenuAction: context.events.gallery.galleryMenuButtonClicked.emit,
    onVideoEnded: () => features.handleVideoEnded(),
    onVideoDoubleClicked: () => flows.openClose.close(),
    onVolumeChanged: (volume) => flows.video.setVolume(volume)
  });
}

function setupControl({ control, flows }: GalleryComponents): void {
  control.setup(() => flows.visibility.handleVisibleThumbsChanged());
}

function setupSubFeatures({ context, view, flows, features }: GalleryComponents): void {
  const { domEvents } = context;

  features.setup({
    autoplay: {
      setVideoLooping: (value) => view.toggleVideoLooping(value),
      onComplete: (direction?: NavigationKey) => flows.dispatch.run<NavigationKey>({
        open: (key) => flows.navigation.navigate(key)
      }, direction),
      onVideoEndedBeforeMinimumViewTime: () => view.restartVideo(),
      subscribeToMouseMove: domEvents.document.mousemove.on,
      subscribeToKeyDown: domEvents.document.keydown.on
    }
  });
}

function subscribeToEvents(components: GalleryComponents): void {
  const { context, view, flows } = components;
  const { events, preferences, environment } = context;

  events.gallery.galleryMenuButtonClicked.on((action) => flows.menu.handleAction(action));
  preferences.gallery.backgroundOpacity.on((opacity) => view.setBackgroundOpacity(opacity));
  preferences.gallery.menuPinned.on((pinned) => view.setMenuPinned(pinned));
  preferences.gallery.menuDockedLeft.on((dockedLeft) => view.setMenuDockedLeft(dockedLeft));
  preferences.gallery.videoMuted.on((muted) => view.setVideoMuted(muted));

  if (environment.onFavoritesPage) {
    subscribeToFavoritesEvents(components);
  }

  if (environment.onPostListPage) {
    subscribeToPostListEvents(components);
  }

  if (environment.onDesktopDevice) {
    subscribeToDesktopInput(components);
  } else {
    subscribeToMobileInput(components);
  }
}

function subscribeToFavoritesEvents({ context, model, flows }: GalleryComponents): void {
  const { events, preferences } = context;

  events.favorites.contentReplaced.on(() => flows.content.refresh());
  events.favorites.contentAdded.on(() => flows.content.refresh());
  preferences.gallery.previewEnabled.on((enabled) => model.preview(enabled));
  preferences.favorites.upscaleThumbs.on((value) => flows.content.toggleUpscaling(value));
  events.favorites.searchResultsUpdated.on(() => flows.content.downscaleThumbsOutsideResults(), { async: true });
}

function subscribeToPostListEvents({ context, flows }: GalleryComponents): void {
  const { events, preferences } = context;

  preferences.postList.upscaleThumbs.on((value) => flows.postList.toggleUpscaling(value));
  events.postList.initialPostListCreated.on(() => flows.postList.preloadOnIdle(), { once: true });
  events.postList.moreResultsAdded.on(() => flows.content.refresh());
  preferences.postList.infiniteScroll.on(() => flows.content.refresh());
  events.postList.pageChanged.on(() => flows.content.refresh());
}

function subscribeToDesktopInput({ context, view, flows }: GalleryComponents): void {
  const { domEvents, events } = context;

  domEvents.document.mouseover.on((event) => flows.mouseOver.handleMouseOver(event));
  domEvents.document.mouseover.on((event) => view.toggleMenuPersistence(event));
  domEvents.document.click.on((event) => flows.click.handleClick(event));
  domEvents.document.mousedown.on((event) => flows.click.handleMouseDown(event));
  domEvents.document.contextmenu.on((event) => flows.click.handleContextMenu(event));
  domEvents.document.mousemove.on((event) => flows.interaction.showCursorInGallery(event));
  domEvents.document.mousemove.on(() => view.revealMenu());
  domEvents.document.wheel.on((event) => flows.wheel.handleWheel(event));
  domEvents.document.keydown.on((event) => flows.key.handleKeyDown(event));
  domEvents.document.keyup.on((event) => flows.key.handleKeyUp(event));
  events.gallery.interactionStopped.on(() => flows.interaction.hideCursorInGallery());
}

function subscribeToMobileInput({ context, view, flows, features }: GalleryComponents): void {
  const { domEvents, events, preferences } = context;

  events.gallery.leftTap.on(() => flows.touch.navigateBackInGallery());
  events.gallery.rightTap.on(() => flows.touch.navigateForwardInGallery());
  domEvents.document.mousedown.on((event) => flows.touch.handleMouseDown(event));
  domEvents.document.touchStart.on((event) => flows.touch.handleTouchStart(event));
  domEvents.mobile.swipedDown.on(() => flows.touch.closeGallery());
  domEvents.mobile.swipedUp.on(() => features.showMenu());
  domEvents.mobile.touchHold.on(() => flows.touch.favoriteCurrentPost());
  domEvents.window.orientationChange.on(() => view.correctOrientation());
  events.gallery.openedGallery.on(() => showTutorialOnFirstOpen(preferences), { once: true });
  events.gallery.showControlsRequested.on(showTutorial);
  events.gallery.closedGallery.on(hideTutorial);
}

function showTutorialOnFirstOpen(preferences: Preferences): void {
  if (!preferences.gallery.tutorialSeen.value) {
    preferences.gallery.tutorialSeen.set(true);
    showTutorial();
  }
}

function serveExternalRequests({ context, model }: GalleryComponents): void {
  const { featureBridge } = context;

  featureBridge.gallery.state.serve(() => model.getCurrentState());
  featureBridge.gallery.currentThumb.serve(() => model.currentThumbIfOpen());
}
