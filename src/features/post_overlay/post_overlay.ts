import { AppContext } from "@/app/context/context";
import { PostOverlayFlows } from "@/features/post_overlay/flows/flows";
import { PostOverlayModel } from "@/features/post_overlay/model/model";
import { PostOverlayShell } from "@/features/post_overlay/shell/shell";
import { PostOverlayView } from "@/features/post_overlay/view/view";

interface PostOverlayComponents {
  context: AppContext;
  model: PostOverlayModel;
  view: PostOverlayView;
  flows: PostOverlayFlows;
}

export function startPostOverlay(context: AppContext): void {
  const shell = new PostOverlayShell(context.shell);
  const model = new PostOverlayModel(context.ports);
  const view = new PostOverlayView(shell);
  const flows = new PostOverlayFlows(context, model, view);
  const components: PostOverlayComponents = { context, model, view, flows };

  setup(components);
}

function setup(components: PostOverlayComponents): void {
  subscribeToEvents(components);
}

function subscribeToEvents({ context, flows }: PostOverlayComponents): void {
  const { domEvents, events, preferences } = context;

  domEvents.document.mouseover.on(event => flows.hover.handleMouseOver(event));
  domEvents.document.mousedown.on(event => flows.tagClick.handleMouseDown(event));
  domEvents.document.contextmenu.on(event => flows.tagClick.handleContextMenu(event));
  domEvents.document.keydown.on(event => flows.key.handleKeyDown(event));
  domEvents.document.keyup.on(event => flows.key.handleKeyUp(event));
  preferences.postOverlay.enabled.on(enabled => flows.toggle.setVisible(enabled));
  domEvents.window.scroll.on(() => flows.hover.hideTemporarily());
  events.favorites.contentReplaced.on(() => flows.hover.hideTemporarily());
  preferences.favorites.columnCount.on(() => flows.hover.hideTemporarily());
  preferences.favorites.layout.on(() => flows.hover.hideTemporarily());
  preferences.favorites.rowHeight.on(() => flows.hover.hideTemporarily());
}
