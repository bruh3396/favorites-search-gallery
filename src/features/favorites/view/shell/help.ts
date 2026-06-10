import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { FavoritesClass, FavoritesHelpLinks } from "@/features/favorites/types/scaffold";
import { icon } from "@/lib/ui/icon";

const PANEL_CLASSES = {
  section: FavoritesClass.drawerSection,
  sectionTitle: FavoritesClass.drawerSectionTitle
};

export function buildHelpPanel(panel: HTMLElement): void {
  const list = document.createElement("div");

  list.className = FavoritesClass.drawerHelpLinks;

  for (const link of FavoritesHelpLinks) {
    list.appendChild(buildLinkRow(link.label, link.href));
  }
  panel.appendChild(DrawerPanel.section(PANEL_CLASSES, "Help", list));
}

function buildLinkRow(label: string, href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");

  anchor.className = FavoritesClass.drawerHelpLink;
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = label;
  anchor.appendChild(icon("externalLink"));
  return anchor;
}
