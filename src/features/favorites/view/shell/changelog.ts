import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { FavoritesClass } from "@/features/favorites/types/scaffold";

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
    version: "v1.22",
    changes: [
      "Redesigned favorites ui",
      "Added search page favorite indicator",
      "Added new themes",
      "Improved post overlay",
      "Improved performance"
    ]
  }
];

export function buildChangelogPanel(panel: HTMLElement): void {
  for (const release of releases) {
    panel.appendChild(DrawerPanel.section(PANEL_CLASSES, release.version, DrawerPanel.bulletList(release.changes)));
  }
}
