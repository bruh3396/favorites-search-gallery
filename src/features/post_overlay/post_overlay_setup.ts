import * as PostOverlayHoverFlow from "@/features/post_overlay/flows/hover_flow";
import * as PostOverlayKeyFlow from "@/features/post_overlay/flows/key_flow";
import * as PostOverlayModel from "@/features/post_overlay/model/post_overlay_model";
import * as PostOverlayTagClickFlow from "@/features/post_overlay/flows/tag_click_flow";
import * as PostOverlayToggleFlow from "@/features/post_overlay/flows/toggle_flow";
import * as PostOverlayView from "@/features/post_overlay/view/post_overlay_view";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { POST_OVERLAY_DISABLED } from "@/app/context/flags";

export async function setupPostOverlay(): Promise<void> {
  if (POST_OVERLAY_DISABLED) {
    return;
  }
  PostOverlayView.setup();
  subscribeToEvents();
  await waitUntilFavoritesAreReady();
  PostOverlayModel.setup();
}

function subscribeToEvents(): void {
  DomEvents.document.mouseover.on(PostOverlayHoverFlow.onMouseover);
  DomEvents.document.mousedown.on(PostOverlayTagClickFlow.onMouseDown);
  DomEvents.document.contextmenu.on(PostOverlayTagClickFlow.onContextMenu);
  DomEvents.document.keydown.on(PostOverlayKeyFlow.onKeyDown);
  DomEvents.document.keyup.on(PostOverlayKeyFlow.onKeyUp);
  Events.favorites.postOverlayToggled.on(PostOverlayToggleFlow.hideIfDisabled);
  Events.favorites.tagCategoriesResolved.on(PostOverlayModel.warmTagCategoryCache);
  Events.favorites.resetConfirmed.on(PostOverlayModel.destroyStore);
  DomEvents.window.scroll.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.pageChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.app.columnCountChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.layoutChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.app.rowHeightChanged.on(PostOverlayHoverFlow.onThumbsMoved);
}

function waitUntilFavoritesAreReady(): Promise<unknown> {
  return ON_FAVORITES_PAGE ? Events.favorites.favoritesDatabaseLoaded.timeout(2_000) : Promise.resolve();
}
