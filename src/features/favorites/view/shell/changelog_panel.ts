import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { FavoritesMenuClass } from "@/features/favorites/types/scaffold";

interface Release {
  version: string;
  changes: string[];
}

const PANEL_CLASSES = {
  section: FavoritesMenuClass.drawerSection,
  sectionTitle: FavoritesMenuClass.drawerSectionTitle
};

const releases: Release[] = [
  {
    version: "v1.22",
    changes: [
      "Redesigned favorites ui",
      "Added new themes",
      "Added favorite indicator",
      "Improved post overlay"
    ]
  }
];

export function buildChangelogPanel(panel: HTMLElement): void {
  for (const release of releases) {
    panel.appendChild(DrawerPanel.section(PANEL_CLASSES, release.version, DrawerPanel.bulletList(release.changes)));
  }
}
