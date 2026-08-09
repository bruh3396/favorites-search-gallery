import { FavoritesClass, FavoritesId, favoritesDrawerSidebarIconId, favoritesDrawerViewId } from "@/features/favorites/types/scaffold";
import { FavoritesDrawerView, FavoritesDrawerViewContent, FavoritesDrawerViewMap } from "@/types/app";
import { IconName, icon } from "@/lib/ui/icon";
import { createElement, div } from "@/utils/dom/element_factory";
import { FavoritesConfig } from "@/config/favorites_config";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";

type FavoritesDrawerViewDescriptor = {
  name: FavoritesDrawerView;
  label: string;
  title?: string;
  icon: IconName;
};

const FavoritesDrawerViews: FavoritesDrawerViewDescriptor[] = [
  { name: "settings", label: "Settings", icon: "settings" },
  { name: "download", label: "Download", title: "Download", icon: "download" },
  { name: "snippets", label: "Snippets", icon: "snippet" },
  { name: "tags", label: "Tags", title: "Edit Tags", icon: "tag" },
  { name: "change", label: "Changelog", icon: "changelog" },
  { name: "help", label: "Help", title: "Help & Support", icon: "help" }
];

export function buildDrawer(renderers: FavoritesDrawerViewMap, onViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
  return createElement(
    "div",
    {
      id: FavoritesId.drawer,
      className: "u-no-select",
      children: [buildSidebar(onViewSelected), buildViews(renderers)]
    }
  );
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

function buildSidebar(onViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
  const sidebar = div(FavoritesId.drawerSidebar);

  FavoritesDrawerViews.forEach(descriptor => sidebar.appendChild(buildSidebarIcon(descriptor, onViewSelected)));
  return sidebar;
}

function buildSidebarIcon(descriptor: FavoritesDrawerViewDescriptor, onViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
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
    onViewSelected(view);
  };
  return button;
}
