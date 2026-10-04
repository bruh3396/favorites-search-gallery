import { AppContext } from "@/app/context/context";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryFeatures } from "@/features/gallery/features/features";
import { GalleryFlows } from "@/features/gallery/flows/flows";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryShell } from "@/features/gallery/shell/shell";
import { GallerySizeSettings } from "@/features/gallery/types/types";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { GalleryView } from "@/features/gallery/view/view";
import { effect } from "@/core/utils/reactive/signal";

interface GalleryComponents {
  context: AppContext;
  model: GalleryModel;
  view: GalleryView;
  control: GalleryControl;
  flows: GalleryFlows;
  features: GalleryFeatures;
}

export async function startGallery(context: AppContext): Promise<void> {
  await waitUntilPageIsReady(context);

  const shell = new GalleryShell(context.shell);
  const model = new GalleryModel(context.preferences, context.ports);
  const view = new GalleryView(context, shell, id => context.featureBridge.favorites.favorite.request(id));
  const control = new GalleryControl(context, shell, view);
  const flows = new GalleryFlows({ context, model, view, control });
  const features = new GalleryFeatures(context, {
    autoplay: {
      navigate: (direction): void => flows.navigation.navigateIfOpen(direction),
      restartVideo: (): void => view.restartVideo(),
      setVideoLooping: (looping): void => view.toggleVideoLooping(looping)
    }
  });
  const components: GalleryComponents = { context, model, view, control, flows, features };

  setup(components);
  start(components);
}

async function waitUntilPageIsReady(context: AppContext): Promise<void> {
  const { environment, milestones } = context;

  if (environment.mode === "favorites") {
    await milestones.favorites.localFavoritesFound.wait();
  }

  if (environment.mode === "postList") {
    await milestones.postList.postListInitialized.wait();
  }
}

function setup(components: GalleryComponents): void {
  setupModel(components);
  setupView(components);
  setupSubFeatures(components);
  setupControl(components);
  bindPreferences(components);
  subscribeToEvents(components);
  serveExternalRequests(components);
}

function start({ flows }: GalleryComponents): void {
  flows.thumbs.refreshInitialContent();
}

function setupModel({ context, model }: GalleryComponents): void {
  const { environment, featureBridge } = context;

  if (environment.mode === "favorites") {
    model.setupWrappingWindow(() => featureBridge.favorites.searchResults.request());
  } else {
    model.setupClampedWindow(() => featureBridge.postList.posts.request());
  }
}

function setupView({ view, flows, features }: GalleryComponents): void {
  view.setup({
    onVideoEnded: () => features.handleVideoEnded(),
    onVolumeChanged: volume => flows.actions.setVolume(volume)
  });
}

function setupControl({ control, flows }: GalleryComponents): void {
  control.setup(() => flows.thumbs.handleVisibleThumbsChanged());
}

function setupSubFeatures({ features }: GalleryComponents): void {
  features.setup();
}

function bindPreferences({ context, view }: GalleryComponents): void {
  const { preferences } = context;

  effect(() => view.setBackgroundOpacity(preferences.gallery.backgroundOpacity.value));
  effect(() => view.setMenuDockedLeft(preferences.gallery.menuDockedLeft.value));
  effect(() => view.setMenuPinned(preferences.gallery.menuPinned.value));
  effect(() => view.setMenuEnabled(preferences.gallery.menuEnabled.value));
}

function subscribeToEvents(components: GalleryComponents): void {
  const { context, view, flows } = components;
  const { events, preferences, environment } = context;

  events.gallery.galleryMenuButtonClicked.on(action => flows.actions.run(action));
  preferences.gallery.videoMuted.on(muted => view.setVideoMuted(muted));

  if (environment.mode === "favorites") {
    subscribeToFavoritesEvents(components);
  }

  if (environment.mode === "postList") {
    subscribeToPostListEvents(components);
  }

  if (environment.device === "desktop") {
    subscribeToDesktopInput(components);
  } else {
    subscribeToMobileInput(components);
  }
}

function subscribeToFavoritesEvents({ context, model, view, flows }: GalleryComponents): void {
  const { events, preferences } = context;

  events.favorites.contentReplaced.on(() => flows.thumbs.refresh());
  events.favorites.contentAdded.on(() => flows.thumbs.refresh());
  preferences.gallery.previewEnabled.on(enabled => model.preview(enabled));
  preferences.favorites.upscaleThumbs.on(value => flows.thumbs.toggleUpscaling(value));
  subscribeToQualityChanges(preferences.favorites, view, flows);
}

function subscribeToPostListEvents({ context, view, flows }: GalleryComponents): void {
  const { events, milestones, preferences } = context;

  preferences.postList.upscaleThumbs.on(value => flows.thumbs.toggleUpscaling(value));
  milestones.postList.initialPostListCreated.wait().then(() => flows.thumbs.preloadPostListOnIdle());
  events.postList.moreResultsAdded.on(() => flows.thumbs.refresh());
  preferences.postList.infiniteScroll.on(() => flows.thumbs.refresh());
  events.postList.pageChanged.on(() => flows.thumbs.refresh());
  subscribeToQualityChanges(preferences.postList, view, flows);
}

function subscribeToQualityChanges(settings: GallerySizeSettings, view: GalleryView, flows: GalleryFlows): void {
  settings.upscaleQuality.on(() => view.reUpscale());

  if (!GalleryUpscaleConfig.dynamicQuality) {
    return;
  }
  settings.layout.on(() => flows.thumbs.updateUpscaleQuality());
  settings.columnCount.on(() => flows.thumbs.updateUpscaleQuality());
  settings.rowHeight.on(() => flows.thumbs.updateUpscaleQuality());
}

function subscribeToDesktopInput({ context, flows }: GalleryComponents): void {
  const { domEvents, events } = context;

  domEvents.document.mouseover.on(event => flows.mouse.handleMouseOver(event));
  domEvents.document.click.on(event => flows.mouse.handleClick(event));
  domEvents.document.dblclick.on(event => flows.mouse.handleDoubleClick(event));
  domEvents.document.mousedown.on(event => flows.mouse.handleMouseDown(event));
  domEvents.document.contextmenu.on(event => flows.mouse.handleContextMenu(event));
  domEvents.document.mousemove.on(event => flows.mouse.handleMouseMove(event));
  domEvents.document.wheel.on(event => flows.mouse.handleWheel(event));
  domEvents.document.keydown.on(event => flows.keyboard.handleKeyDown(event));
  domEvents.document.keyup.on(event => flows.keyboard.handleKeyUp(event));
  events.gallery.interactionStopped.on(() => flows.mouse.hideCursor());
}

function subscribeToMobileInput({ context, view, flows, features }: GalleryComponents): void {
  const { domEvents, events } = context;

  events.gallery.leftTapped.on(() => flows.touch.navigateBack());
  events.gallery.rightTapped.on(() => flows.touch.navigateForward());
  domEvents.document.mousedown.on(event => flows.touch.handleMouseDown(event));
  domEvents.document.touchStart.on(event => flows.touch.handleTouchStart(event));
  domEvents.document.touchEnd.on(event => flows.touch.handleTouchEnd(event));
  domEvents.mobile.swipeDown.on(() => flows.touch.close());
  domEvents.mobile.swipeUp.on(() => features.showMenu());
  domEvents.mobile.touchHold.on(() => flows.touch.favoriteCurrentPost());
  domEvents.window.orientationChange.on(() => view.correctOrientation());
  events.gallery.galleryOpened.once(() => flows.touch.showTutorialOnFirstOpen());
  events.gallery.tutorialRequested.on(() => view.showTutorial());
  events.gallery.galleryClosed.on(() => view.hideTutorial());
}

function serveExternalRequests({ context, model }: GalleryComponents): void {
  const { featureBridge } = context;

  featureBridge.gallery.state.serve(() => model.getCurrentState());
}
