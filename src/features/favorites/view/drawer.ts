import { FavoritesDrawerSectionName, FavoritesDrawerSectionNames } from "@/types/favorites_ui";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { toggleDataset } from "@/utils/browser/dataset";

export class FavoritesDrawer {
  constructor(private readonly shell: FavoritesShell) {}

  public toggle(open: boolean): void {
    toggleDataset(this.shell.root, "drawerOpen", open);
  }

  public showSection(active: FavoritesDrawerSectionName): void {
    for (const name of FavoritesDrawerSectionNames) {
      const { tab, root } = this.shell.drawer[name];

      toggleDataset(tab, "selected", name === active);
      toggleDataset(root, "hidden", name !== active);
    }
  }
}
