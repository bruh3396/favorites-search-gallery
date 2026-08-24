import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { FavoritesClass } from "@/features/favorites/types/scaffold";
import { FavoritesDrawerViewContent } from "@/types/favorite";

interface Release {
  version: string;
  changes: string[];
}

const PANEL_CLASSES = {
  section: FavoritesClass.drawerSection,
  sectionTitle: FavoritesClass.drawerSectionTitle
};

const releases: Release[] = [
  {
    version: "v1.22.0",
    changes: [
      "Redesigned favorites ui",
      "Added search page favorite indicator",
      "Added themes",
      "Added download naming",
      "Improved thumb overlay",
      "Improved performance"
    ]
  }
];

export function buildDrawerView(): FavoritesDrawerViewContent {
  return { mount: buildChangelogPanel };
}

function buildChangelogPanel(panel: HTMLElement): void {
  for (const release of releases) {
    panel.appendChild(DrawerPanel.section(PANEL_CLASSES, release.version, bulletList(release.changes)));
  }
}

function bulletList(items: string[]): HTMLUListElement {
  const list = document.createElement("ul");

  for (const item of items) {
    const entry = document.createElement("li");

    entry.textContent = item;
    list.appendChild(entry);
  }
  return list;
}
