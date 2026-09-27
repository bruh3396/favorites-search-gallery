import { FavoritesClass, FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesDrawerSection, FavoritesDrawerSectionName, FavoritesDrawerSlots } from "@/types/favorites_ui";
import { IconName, icon } from "@/lib/ui/icon";
import { createElement, div } from "@/utils/browser/element";
import { ShellPart } from "@/types/ui";

interface DrawerSectionDescriptor {
  name: FavoritesDrawerSectionName;
  label: string;
  title: string;
  icon: IconName;
}

const DRAWER_SECTIONS: DrawerSectionDescriptor[] = [
  { name: "settings", label: "Settings", title: "Settings", icon: "settings" },
  { name: "download", label: "Download", title: "Download", icon: "download" },
  { name: "snippets", label: "Snippets", title: "Snippets", icon: "snippet" },
  { name: "tags", label: "Tags", title: "Edit Tags", icon: "tag" },
  { name: "change", label: "Changelog", title: "Changelog", icon: "changelog" },
  { name: "help", label: "Help", title: "Help", icon: "help" }
];

export function build(): ShellPart<FavoritesDrawerSlots> {
  const slots = Object.fromEntries(DRAWER_SECTIONS.map(descriptor => [descriptor.name, section(descriptor)])) as FavoritesDrawerSlots;
  const sections = Object.values(slots);
  const sidebar = createElement("div", { id: FavoritesId.drawerSidebar, children: sections.map(({ tab }) => tab) });
  const sectionContainer = createElement("div", { id: FavoritesId.drawerSections, children: sections.map(({ root }) => root) });
  const root = createElement("div", { id: FavoritesId.drawer, className: "u-no-select", children: [sidebar, sectionContainer] });
  return { root, slots };
}

function section(descriptor: DrawerSectionDescriptor): FavoritesDrawerSection {
  const tab = createElement("button", {
    id: `${FavoritesClass.drawerSidebarIcon}-${descriptor.name}`,
    className: FavoritesClass.drawerSidebarIcon,
    children: [icon(descriptor.icon), createElement("span", { className: FavoritesClass.drawerSidebarIconLabel, textContent: descriptor.label })]
  });
  const label = createElement("span", { className: FavoritesClass.drawerTitleLabel, textContent: descriptor.title });
  const title = createElement("div", { className: FavoritesClass.drawerTitle, children: [label] });
  const body = createElement("div", { className: FavoritesClass.drawerBody });
  const root = div(`${FavoritesClass.drawerSection}-${descriptor.name}`);

  tab.setAttribute("aria-label", descriptor.label);
  root.className = FavoritesClass.drawerSection;
  root.append(title, body);
  return { label: descriptor.label, tab, root, title, body };
}
