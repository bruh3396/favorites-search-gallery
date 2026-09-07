import * as PostOverlayFlows from "@/features/post_overlay/flows/flows";
import * as PostOverlayView from "@/features/post_overlay/view/view";
import * as TagCategoryStore from "@/lib/tag_categories/store";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
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
}

function start(): void {
  TagCategoryStore.preload();
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
  DomEvents.window.scroll.on(PostOverlayFlows.Hover.hideTemporarily);
  Events.favorites.contentReplaced.on(PostOverlayFlows.Hover.hideTemporarily);
  Preferences.favorites.columnCount.on(PostOverlayFlows.Hover.hideTemporarily);
  Preferences.favorites.layout.on(PostOverlayFlows.Hover.hideTemporarily);
  Preferences.favorites.rowHeight.on(PostOverlayFlows.Hover.hideTemporarily);
}

function waitUntilFavoritesAreReady(): Promise<unknown> {
  return ON_FAVORITES_PAGE ? Events.favorites.storedFavoritesLoaded.timeout(2_000) : Promise.resolve();
}
