import * as TooltipHoverFlow from "@/features/tooltip/flows/hover_flow";
import * as TooltipModel from "@/features/tooltip/model/tooltip_model";
import * as TooltipScrollFlow from "@/features/tooltip/flows/scroll_flow";
import * as TooltipToggleFlow from "@/features/tooltip/flows/toggle_flow";
import * as TooltipView from "@/features/tooltip/view/tooltip_view";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { ON_FAVORITES_PAGE } from "@/lib/environment";

export function startTooltip(): void {
  setup();
  start();
}

function setup(): void {
  setupView();
  subscribeToEvents();
}

function setupView(): void {
  TooltipView.setup();
}

function subscribeToEvents(): void {
  DomEvents.document.mouseover.on(TooltipHoverFlow.onMouseover);
  DomEvents.window.scrollend.on(TooltipScrollFlow.onScroll);
  Events.app.tooltipToggled.on(TooltipToggleFlow.onTooltipToggled);

  if (ON_FAVORITES_PAGE) {
    Events.favorites.searchStarted.on(TooltipModel.rebuildHighlights);
  }
}

function start(): void {
  TooltipModel.rebuildHighlights(FeatureBridge.currentSearchQuery.call());
}
