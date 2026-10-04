import * as DrawerGroup from "@/lib/ui/drawer_group";
import { FavoritesClass } from "@/features/favorites/types/selectors";
import { FavoritesDrawerSectionContent } from "@/types/favorites_ui";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

const HELP_LINKS: { label: string; href: string }[] = [
  { label: "Controls", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Search Syntax", href: "https://github.com/bruh3396/favorites-search-gallery/#search-syntax" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];

const GROUP_CLASSES = {
  group: FavoritesClass.drawerGroup,
  groupTitle: FavoritesClass.drawerGroupTitle
};

export function buildDrawerSection(offersTutorial: boolean, requestTutorial: () => void): FavoritesDrawerSectionContent {
  return { mount: container => mount(offersTutorial, container, requestTutorial) };
}

function mount(offersTutorial: boolean, container: HTMLElement, requestTutorial: () => void): void {
  const rows: HTMLElement[] = [
    ...(offersTutorial ? [buildControlsRow(requestTutorial)] : []),
    ...HELP_LINKS.map(link => buildLinkRow(link.label, link.href))
  ];
  const list = createElement("div", { className: FavoritesClass.drawerHelpLinks, children: rows });

  container.appendChild(DrawerGroup.build(GROUP_CLASSES, "", list));
}

function buildControlsRow(requestTutorial: () => void): HTMLButtonElement {
  const button = createElement("button", {
    className: FavoritesClass.drawerHelpLink,
    textContent: "Gallery Controls",
    children: [icon("help")]
  });

  button.addEventListener("click", requestTutorial);
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
