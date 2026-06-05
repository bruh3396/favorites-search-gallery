import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { FavoritesMenuClass, favoritesHelpLinks } from "@/features/favorites/types/scaffold";
import { icon } from "@/lib/ui/icon";

const PANEL_CLASSES = {
  section: FavoritesMenuClass.drawerSection,
  sectionTitle: FavoritesMenuClass.drawerSectionTitle
};

export function buildHelpPanel(panel: HTMLElement): void {
  const list = document.createElement("div");

  list.className = FavoritesMenuClass.drawerHelpLinks;

  for (const link of favoritesHelpLinks) {
    list.appendChild(buildLinkRow(link.label, link.href));
  }
  panel.appendChild(DrawerPanel.section(PANEL_CLASSES, "Help", list));
}

function buildLinkRow(label: string, href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");

  anchor.className = FavoritesMenuClass.drawerHelpLink;
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = label;
  anchor.appendChild(icon("externalLink"));
  return anchor;
}
