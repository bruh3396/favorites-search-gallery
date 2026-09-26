import { FavoritesDrawerView, FavoritesDrawerViewNames } from "@/types/favorite";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { toggleDataset } from "@/utils/browser/dataset";

export class FavoritesDrawer {
  constructor(private readonly shell: FavoritesShell) {}

  public toggle(open: boolean): void {
    toggleDataset(this.shell.root, "drawerOpen", open);
  }

  public showView(active: FavoritesDrawerView): void {
    for (const name of FavoritesDrawerViewNames) {
      const { tab, view } = this.shell.drawer[name];

      toggleDataset(tab, "selected", name === active);
      toggleDataset(view, "hidden", name !== active);
    }
  }
}
