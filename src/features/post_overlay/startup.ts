import * as TagCategoryStore from "@/lib/domain/tag/category_store";
import { AppContext } from "@/app/context/context";
import { PostOverlayFlows } from "@/features/post_overlay/flows/flows";
import { PostOverlayModel } from "@/features/post_overlay/model/model";
import { PostOverlayView } from "@/features/post_overlay/view/view";

interface PostOverlayComponents {
  context: AppContext;
  model: PostOverlayModel;
  view: PostOverlayView;
  flows: PostOverlayFlows;
}

export async function startPostOverlay(context: AppContext): Promise<void> {
  if (context.flags.postOverlayDisabled) {
    return;
  }
  const model = new PostOverlayModel();
  const view = new PostOverlayView(context.shell);
  const flows = new PostOverlayFlows(context, model, view);
  const components: PostOverlayComponents = { context, model, view, flows };

  setup(components);
  await waitUntilFavoritesAreReady(context);
  start();
}

function setup(components: PostOverlayComponents): void {
  subscribeToEvents(components);
}

function start(): void {
  TagCategoryStore.preload();
}

function subscribeToEvents({ context, flows }: PostOverlayComponents): void {
  const { domEvents, events, preferences } = context;

  domEvents.document.mouseover.on((event) => flows.hover.handleMouseOver(event));
  domEvents.document.mousedown.on((event) => flows.tagClick.handleMouseDown(event));
  domEvents.document.contextmenu.on((event) => flows.tagClick.handleContextMenu(event));
  domEvents.document.keydown.on((event) => flows.key.handleKeyDown(event));
  domEvents.document.keyup.on((event) => flows.key.handleKeyUp(event));
  preferences.postOverlay.enabled.on((enabled) => flows.toggle.setVisible(enabled));
  domEvents.window.scroll.on(() => flows.hover.hideTemporarily());
  events.favorites.contentReplaced.on(() => flows.hover.hideTemporarily());
  preferences.favorites.columnCount.on(() => flows.hover.hideTemporarily());
  preferences.favorites.layout.on(() => flows.hover.hideTemporarily());
  preferences.favorites.rowHeight.on(() => flows.hover.hideTemporarily());
}

function waitUntilFavoritesAreReady(context: AppContext): Promise<unknown> {
  return context.environment.onFavoritesPage ? context.events.favorites.storedFavoritesLoaded.timeout(2_000) : Promise.resolve();
}
