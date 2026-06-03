import * as PostOverlayHoverFlow from "./flows/hover_flow";
import * as PostOverlayModel from "./model/post_overlay_model";
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
  Events.favorites.postOverlayToggled.on(PostOverlayToggleFlow.onPostOverlayToggled);
}
