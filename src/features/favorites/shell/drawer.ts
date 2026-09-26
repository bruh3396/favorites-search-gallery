import { FavoritesClass, FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesDrawerBuild, FavoritesDrawerSlots, FavoritesDrawerViewSlots } from "@/features/favorites/types/types";
import { IconName, icon } from "@/lib/ui/icon";
import { createElement, div } from "@/utils/browser/element";
import { FavoritesDrawerView } from "@/types/favorite";

interface DrawerViewDescriptor {
  name: FavoritesDrawerView;
  label: string;
  title: string;
  icon: IconName;
}

const DRAWER_VIEWS: DrawerViewDescriptor[] = [
  { name: "settings", label: "Settings", title: "Settings", icon: "settings" },
  { name: "download", label: "Download", title: "Download", icon: "download" },
  { name: "snippets", label: "Snippets", title: "Snippets", icon: "snippet" },
  { name: "tags", label: "Tags", title: "Edit Tags", icon: "tag" },
  { name: "change", label: "Changelog", title: "Changelog", icon: "changelog" },
  { name: "help", label: "Help", title: "Help", icon: "help" }
];

export function build(): FavoritesDrawerBuild {
  const slots = Object.fromEntries(DRAWER_VIEWS.map(descriptor => [descriptor.name, viewSlots(descriptor)])) as FavoritesDrawerSlots;
  const views = Object.values(slots);
  const sidebar = createElement("div", { id: FavoritesId.drawerSidebar, children: views.map(({ tab }) => tab) });
  const viewContainer = createElement("div", { id: FavoritesId.drawerViews, children: views.map(({ view }) => view) });
  const root = createElement("div", { id: FavoritesId.drawer, className: "u-no-select", children: [sidebar, viewContainer] });
  return { root, slots };
}

function viewSlots(descriptor: DrawerViewDescriptor): FavoritesDrawerViewSlots {
  const tab = createElement("button", {
    id: `${FavoritesClass.drawerSidebarIcon}-${descriptor.name}`,
    className: FavoritesClass.drawerSidebarIcon,
    children: [icon(descriptor.icon), createElement("span", { className: FavoritesClass.drawerSidebarIconLabel, textContent: descriptor.label })]
  });
  const label = createElement("span", { className: FavoritesClass.drawerTitleLabel, textContent: descriptor.title });
  const title = createElement("div", { className: FavoritesClass.drawerTitle, children: [label] });
  const panel = createElement("div", { className: FavoritesClass.drawerPanel });
  const view = div(`${FavoritesClass.drawerView}-${descriptor.name}`);

  tab.setAttribute("aria-label", descriptor.label);
  view.className = FavoritesClass.drawerView;
  view.append(title, panel);
  return { tab, view, title, panel };
}
