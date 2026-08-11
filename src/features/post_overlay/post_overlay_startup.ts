import * as PostOverlayHoverFlow from "@/features/post_overlay/flows/hover_flow";
import * as PostOverlayKeyFlow from "@/features/post_overlay/flows/key_flow";
import * as PostOverlayModel from "@/features/post_overlay/model/post_overlay_model";
import * as PostOverlayTagClickFlow from "@/features/post_overlay/flows/tag_click_flow";
import * as PostOverlayToggleFlow from "@/features/post_overlay/flows/toggle_flow";
import * as PostOverlayView from "@/features/post_overlay/view/post_overlay_view";
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
  FeatureBridge.postOverlay.tagCategory.register(PostOverlayModel.getTagCategory);
}

function start(): void {
  PostOverlayModel.preloadTagCategoryCache();
}

function setupView(): void {
  PostOverlayView.setup();
}

function subscribeToEvents(): void {
  DomEvents.document.mouseover.on(PostOverlayHoverFlow.onMouseover);
  DomEvents.document.mousedown.on(PostOverlayTagClickFlow.onMouseDown);
  DomEvents.document.contextmenu.on(PostOverlayTagClickFlow.onContextMenu);
  DomEvents.document.keydown.on(PostOverlayKeyFlow.onKeyDown);
  DomEvents.document.keyup.on(PostOverlayKeyFlow.onKeyUp);
  Preferences.postOverlay.enabled.on(PostOverlayToggleFlow.onToggled);
  Events.favorites.tagCategoriesResolved.on(PostOverlayModel.warmTagCategoryCache);
  Events.favorites.resetConfirmed.on(PostOverlayModel.destroyTagCategoryStore);
  DomEvents.window.scroll.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.pageChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Preferences.favorites.columnCount.on(PostOverlayHoverFlow.onThumbsMoved);
  Preferences.favorites.layout.on(PostOverlayHoverFlow.onThumbsMoved);
  Preferences.favorites.rowHeight.on(PostOverlayHoverFlow.onThumbsMoved);
}

function waitUntilFavoritesAreReady(): Promise<unknown> {
  return ON_FAVORITES_PAGE ? Events.favorites.storedFavoritesLoaded.timeout(2_000) : Promise.resolve();
}
