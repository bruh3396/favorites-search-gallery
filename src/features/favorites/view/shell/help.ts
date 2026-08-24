import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { FavoritesClass, FavoritesHelpLinks } from "@/features/favorites/types/scaffold";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

const PANEL_CLASSES = {
  section: FavoritesClass.drawerSection,
  sectionTitle: FavoritesClass.drawerSectionTitle
};

export function buildDrawerView(onShowControls: () => void): FavoritesDrawerViewContent {
  return { mount: (panel) => buildHelpPanel(panel, onShowControls) };
}

function buildHelpPanel(panel: HTMLElement, onShowControls: () => void): void {
  const rows: HTMLElement[] = [];

  if (ON_MOBILE_DEVICE) {
    rows.push(buildControlsRow(onShowControls));
  }

  for (const link of FavoritesHelpLinks) {
    rows.push(buildLinkRow(link.label, link.href));
  }
  const list = createElement("div", { className: FavoritesClass.drawerHelpLinks, children: rows });

  panel.appendChild(DrawerPanel.section(PANEL_CLASSES, "", list));
}

function buildControlsRow(onShowControls: () => void): HTMLButtonElement {
  const button = createElement("button", {
    className: FavoritesClass.drawerHelpLink,
    textContent: "Gallery Controls",
    children: [icon("help")]
  });

  button.addEventListener("click", onShowControls);
  return button;
}

function buildLinkRow(label: string, href: string): HTMLAnchorElement {
  const anchor = createElement("a", {
    className: FavoritesClass.drawerHelpLink,
    textContent: label,
    children: [icon("externalLink")]
  });

  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  return anchor;
}
