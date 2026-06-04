import * as TooltipHoverFlow from "@/features/tooltip/flows/hover_flow";
import * as TooltipModel from "@/features/tooltip/model/tooltip_model";
import * as TooltipScrollFlow from "@/features/tooltip/flows/scroll_flow";
import * as TooltipToggleFlow from "@/features/tooltip/flows/toggle_flow";
import * as TooltipView from "@/features/tooltip/view/tooltip_view";
import { DomEvents } from "@/app/input/dom_events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { ON_FAVORITES_PAGE } from "@/lib/environment";

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
