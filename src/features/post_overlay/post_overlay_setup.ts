import * as PostOverlayHoverFlow from "./flows/hover_flow";
import * as PostOverlayModel from "./model/post_overlay_model";
import * as PostOverlayTagClickFlow from "./flows/tag_click_flow";
import * as PostOverlayToggleFlow from "./flows/toggle_flow";
import * as PostOverlayView from "./view/post_overlay_view";
import { DomEvents } from "../../app/input/dom_events";
import { Events } from "../../app/channels/events";
import { POST_OVERLAY_DISABLED } from "../../app/context/flags";

export function setupPostOverlay(): void {
  if (POST_OVERLAY_DISABLED) {
    return;
  }
  PostOverlayModel.setup();
  PostOverlayView.setup();
  subscribeToEvents();
}

function subscribeToEvents(): void {
  DomEvents.document.mouseover.on(PostOverlayHoverFlow.onMouseover);
  DomEvents.document.mousedown.on(PostOverlayTagClickFlow.onMouseDown);
  DomEvents.document.contextmenu.on(PostOverlayTagClickFlow.onContextMenu);
  Events.favorites.postOverlayToggled.on(PostOverlayToggleFlow.onPostOverlayToggled);
  DomEvents.window.scroll.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.pageChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.columnCountChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.layoutChanged.on(PostOverlayHoverFlow.onThumbsMoved);
  Events.favorites.rowSizeChanged.on(PostOverlayHoverFlow.onThumbsMoved);
}
