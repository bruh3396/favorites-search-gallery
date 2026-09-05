import * as PostOverlayFlows from "@/features/post_overlay/flows/flows";
import * as PostOverlayModel from "@/features/post_overlay/model/model";
import * as PostOverlayView from "@/features/post_overlay/view/view";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { POST_OVERLAY_DISABLED } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";

export async function startPostOverlay(): Promise<void> {
  if (POST_OVERLAY_DISABLED) {
    return;
  }
  setup();
  await waitUntilFavoritesAreReady();
  start();
}

function setup(): void {
  setupView();
  subscribeToEvents();
  serveExternalRequests();
}

function serveExternalRequests(): void {
  FeatureBridge.postOverlay.tagCategory.serve(PostOverlayModel.getTagCategory);
}

function start(): void {
  PostOverlayModel.preloadTagCategoryCache();
}

function setupView(): void {
  PostOverlayView.setup();
}

function subscribeToEvents(): void {
  DomEvents.document.mouseover.on(PostOverlayFlows.Hover.handleMouseOver);
  DomEvents.document.mousedown.on(PostOverlayFlows.TagClick.handleMouseDown);
  DomEvents.document.contextmenu.on(PostOverlayFlows.TagClick.handleContextMenu);
  DomEvents.document.keydown.on(PostOverlayFlows.Key.handleKeyDown);
  DomEvents.document.keyup.on(PostOverlayFlows.Key.handleKeyUp);
  Preferences.postOverlay.enabled.on(PostOverlayFlows.Toggle.setVisible);
  Events.favorites.tagCategoriesResolved.on(PostOverlayModel.warmTagCategoryCache);
  DomEvents.window.scroll.on(PostOverlayFlows.Hover.hideTemporarily);
  Events.favorites.contentReplaced.on(PostOverlayFlows.Hover.hideTemporarily);
  Preferences.favorites.columnCount.on(PostOverlayFlows.Hover.hideTemporarily);
  Preferences.favorites.layout.on(PostOverlayFlows.Hover.hideTemporarily);
  Preferences.favorites.rowHeight.on(PostOverlayFlows.Hover.hideTemporarily);
}

function waitUntilFavoritesAreReady(): Promise<unknown> {
  return ON_FAVORITES_PAGE ? Events.favorites.storedFavoritesLoaded.timeout(2_000) : Promise.resolve();
}
