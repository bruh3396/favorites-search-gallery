import * as DrawerGroup from "@/lib/ui/drawer_group";
import { Device, Environment } from "@/core/boundary/environment";
import { FavoritesClass } from "@/features/favorites/types/selectors";
import { FavoritesDrawerSectionContent } from "@/types/favorites_ui";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";

const HELP_LINKS: { label: string; href: string }[] = [
  { label: "Controls", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Search Syntax", href: "https://github.com/bruh3396/favorites-search-gallery/#search-syntax" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];

// The gallery's controls tutorial is touch-only.
const DEVICE_ROWS: Record<Device, (requestTutorial: () => void) => HTMLElement[]> = {
  desktop: () => [],
  mobile: requestTutorial => [buildControlsRow(requestTutorial)]
};

const GROUP_CLASSES = {
  group: FavoritesClass.drawerGroup,
  groupTitle: FavoritesClass.drawerGroupTitle
};

export function buildDrawerSection(environment: Environment, requestTutorial: () => void): FavoritesDrawerSectionContent {
  return { mount: (container) => mount(environment, container, requestTutorial) };
}

function mount(environment: Environment, container: HTMLElement, requestTutorial: () => void): void {
  const rows: HTMLElement[] = [
    ...DEVICE_ROWS[environment.device](requestTutorial),
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
