import { AppContext } from "@/app/context/context";
import { TooltipComponents } from "@/features/tooltip/types/types";
import { TooltipFlows } from "@/features/tooltip/flows/flows";
import { TooltipModel } from "@/features/tooltip/model/model";
import { TooltipView } from "@/features/tooltip/view/view";

export function startTooltip(context: AppContext): void {
  if (context.flags.tooltipDisabled) {
    return;
  }
  const model = new TooltipModel(context);
  const view = new TooltipView(context);
  const flows = new TooltipFlows(context, model, view);
  const components: TooltipComponents = { context, model, view, flows };

  setup(components);
  start(components);
}

function setup(components: TooltipComponents): void {
  setupView(components);
  subscribeToEvents(components);
}

function setupView({ view }: TooltipComponents): void {
  view.setup();
}

function subscribeToEvents({ context, model, flows }: TooltipComponents): void {
  const { domEvents, events, preferences, environment } = context;

  domEvents.document.mouseover.on((event) => flows.hover.handleMouseOver(event));
  domEvents.window.scrollend.on(() => flows.scroll.reposition());
  preferences.favorites.tooltipEnabled.on((value) => flows.toggle.hideIfDisabled(value));
  preferences.postList.tooltipEnabled.on((value) => flows.toggle.hideIfDisabled(value));

  if (environment.onFavoritesPage) {
    events.favorites.searchRequested.on((query) => model.rebuildHighlights(query), { async: true });
  }
}

function start({ context, model }: TooltipComponents): void {
  model.rebuildHighlights(context.featureBridge.currentSearchQuery());
}
