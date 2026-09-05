import * as TooltipFlows from "@/features/tooltip/flows/flows";
import * as TooltipModel from "@/features/tooltip/model/model";
import * as TooltipView from "@/features/tooltip/view/view";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { TOOLTIP_DISABLED } from "@/app/context/flags";
import { getCurrentSearchQuery } from "@/app/channels/feature_bridge";

export function startTooltip(): void {
  if (TOOLTIP_DISABLED) {
    return;
  }
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
  DomEvents.document.mouseover.on(TooltipFlows.Hover.handleMouseOver);
  DomEvents.window.scrollend.on(TooltipFlows.Scroll.reposition);
  Preferences.favorites.tooltipEnabled.on(TooltipFlows.Toggle.hideIfDisabled);
  Preferences.postList.tooltipEnabled.on(TooltipFlows.Toggle.hideIfDisabled);

  if (ON_FAVORITES_PAGE) {
    Events.favorites.searchRequested.on(TooltipModel.rebuildHighlights);
  }
}

function start(): void {
  TooltipModel.rebuildHighlights(getCurrentSearchQuery());
}
