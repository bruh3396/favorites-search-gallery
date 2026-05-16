import * as TooltipHoverFlow from "./flows/hover_flow";
import * as TooltipModel from "./model/tooltip_model";
import * as TooltipScrollFlow from "./flows/scroll_flow";
import * as TooltipToggleFlow from "./flows/toggle_flow";
import * as TooltipView from "./view/tooltip_view";
import { DomEvents } from "../../lib/communication/dom_events";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";

export function setupTooltip(): void {
  TooltipView.setup();
  TooltipModel.rebuildHighlights(FeatureBridge.currentSearchQuery.call());
  subscribeToEvents();
}

function subscribeToEvents(): void {
  DomEvents.document.mouseover.on(TooltipHoverFlow.onMouseover);
  DomEvents.window.scrollend.on(TooltipScrollFlow.onScroll);
  Events.favorites.tooltipToggled.on(TooltipToggleFlow.onTooltipToggled);

  if (ON_FAVORITES_PAGE) {
    Events.favorites.searchStarted.on(TooltipModel.rebuildHighlights);
  }
}
