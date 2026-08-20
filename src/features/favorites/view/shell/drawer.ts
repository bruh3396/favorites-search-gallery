import * as FavoritesShell from "@/features/favorites/view/shell/shell";
import { FavoritesClass, FavoritesDrawerViewDescriptor, FavoritesDrawerViews, FavoritesId, favoritesDrawerSidebarIconId, favoritesDrawerViewId } from "@/features/favorites/types/scaffold";
import { FavoritesDrawerView, FavoritesDrawerViewContent, FavoritesDrawerViewMap, FavoritesDrawerViewNames } from "@/types/favorite";
import { createElement, div } from "@/utils/browser/factory";
import { removeDataset, setDataset, toggleDataset } from "@/utils/browser/dataset";
import { FavoritesConfig } from "@/config/favorites_config";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { icon } from "@/lib/ui/icon";

let activeView: FavoritesDrawerView = Preferences.favorites.drawerActiveView.value;
let onOpen: () => void = () => { };
let onViewSelected: (view: FavoritesDrawerView) => void = () => { };

export function setup(
  renderers: FavoritesDrawerViewMap, onDrawerOpen: () => void,
  onDrawerViewSelected: (view: FavoritesDrawerView) => void
): void {
  onOpen = onDrawerOpen;
  onViewSelected = onDrawerViewSelected;
  toggle(Preferences.favorites.drawerOpen.value);
  applySidebarLabelVisibility();
  insertDrawer(renderers);
  renderView(activeView);
  setupViewShortcut(FavoritesId.aboutVersion, "change");
  setupViewShortcut(FavoritesId.aboutHelp, "help");
}

export function toggle(open: boolean): void {
  toggleDataset(FavoritesShell.FavoritesRoot, "drawerOpen", open);
}

function applySidebarLabelVisibility(): void {
  if (!FavoritesConfig.drawerSidebarLabelsEnabled) {
    setDataset(FavoritesShell.FavoritesRoot, "drawerIconOnly", "");
  }
}

function insertDrawer(renderers: FavoritesDrawerViewMap): void {
  FavoritesShell.FavoritesDrawerTrack.appendChild(buildDrawer(renderers, selectView));
}

function buildDrawer(
  renderers: FavoritesDrawerViewMap,
  onDrawerViewSelected: (view: FavoritesDrawerView) => void
): HTMLElement {
  return createElement(
    "div",
    {
      id: FavoritesId.drawer,
      className: "u-no-select",
      children: [buildSidebar(onDrawerViewSelected), buildViews(renderers)]
    }
  );
}

function buildSidebar(onDrawerViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
  const sidebar = div(FavoritesId.drawerSidebar);

  FavoritesDrawerViews.forEach(descriptor => sidebar.appendChild(sidebarIcon(descriptor, onDrawerViewSelected)));
  return sidebar;
}

function sidebarIcon(descriptor: FavoritesDrawerViewDescriptor, onDrawerViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
  const { name: view, label, icon: iconName } = descriptor;
  const button = document.createElement("button");

  button.id = favoritesDrawerSidebarIconId(view);
  button.className = FavoritesClass.drawerSidebarIcon;
  button.appendChild(icon(iconName));

  if (FavoritesConfig.drawerSidebarLabelsEnabled) {
    const labelSpan = createElement("span", { className: FavoritesClass.drawerSidebarIconLabel, textContent: label });

    button.appendChild(labelSpan);
  } else {
    addTooltip(button, label, "right");
  }
  button.onclick = (): void => {
    onDrawerViewSelected(view);
  };
  return button;
}

function buildViews(builders: FavoritesDrawerViewMap): HTMLElement {
  return createElement("div", {
    id: FavoritesId.drawerViews,
    children: FavoritesDrawerViews.map(descriptor => buildView(descriptor, builders[descriptor.name]))
  });
}

function buildView(descriptor: FavoritesDrawerViewDescriptor, content: FavoritesDrawerViewContent | undefined): HTMLElement {
  const { name: view, label, title } = descriptor;
  const element = div(favoritesDrawerViewId(view));

  element.className = FavoritesClass.drawerView;
  element.append(buildTitle(title ?? label, content?.actions ?? []), buildPanel(content?.mount));
  return element;
}

function buildTitle(label: string, actions: HTMLElement[]): HTMLElement {
  const labelElement = createElement("span", { className: FavoritesClass.drawerTitleLabel, textContent: label });

  actions.forEach(action => action.classList.add(FavoritesClass.drawerTitleAction));
  return createElement("div", { className: FavoritesClass.drawerTitle, children: [labelElement, ...actions] });
}

function buildPanel(mount: ((panel: HTMLElement) => void) | undefined): HTMLElement {
  const panel = createElement("div", { className: FavoritesClass.drawerPanel });

  mount?.(panel);
  return panel;
}

function selectView(view: FavoritesDrawerView): void {
  onViewSelected(view);
  renderView(view);
}

function renderView(view: FavoritesDrawerView): void {
  activeView = view;

  for (const candidate of FavoritesDrawerViewNames) {
    const isActive = candidate === view;
    const tabElement = document.getElementById(favoritesDrawerSidebarIconId(candidate));
    const viewElement = document.getElementById(favoritesDrawerViewId(candidate));

    if (isActive) {
      setDataset(tabElement, "selected", "");
      removeDataset(viewElement, "hidden");
    } else {
      removeDataset(tabElement, "selected");
      setDataset(viewElement, "hidden", "");
    }
  }
}

function setupViewShortcut(elementId: string, view: FavoritesDrawerView): void {
  const element = document.getElementById(elementId);

  if (element === null) {
    return;
  }
  element.onclick = (): void => {
    if (!isOpen()) {
      onOpen();
    }
    selectView(view);
  };
}

function isOpen(): boolean {
  return FavoritesShell.FavoritesRoot.dataset.drawerOpen !== undefined;
}
