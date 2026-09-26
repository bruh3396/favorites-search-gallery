import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { Environment } from "@/app/context/environment";
import { FavoritesClass } from "@/features/favorites/types/selectors";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

const HELP_LINKS: { label: string; href: string }[] = [
  { label: "Controls", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Search Syntax", href: "https://github.com/bruh3396/favorites-search-gallery/#search-syntax" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];

const PANEL_CLASSES = {
  section: FavoritesClass.drawerSection,
  sectionTitle: FavoritesClass.drawerSectionTitle
};

export function buildDrawerView(environment: Environment, onShowControls: () => void): FavoritesDrawerViewContent {
  return { mount: (panel) => buildHelpPanel(environment, panel, onShowControls) };
}

function buildHelpPanel(environment: Environment, panel: HTMLElement, onShowControls: () => void): void {
  const rows: HTMLElement[] = [];

  if (environment.onMobileDevice) {
    rows.push(buildControlsRow(onShowControls));
  }

  for (const link of HELP_LINKS) {
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
