import * as FavoritesDrawer from "@/features/favorites/shell/drawer";
import * as FavoritesToolbar from "@/features/favorites/shell/toolbar";
import { FavoritesDrawerSlots, FavoritesToolbarSlots } from "@/features/favorites/types/types";
import { Environment } from "@/app/context/environment";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";
import { toggleDataset } from "@/utils/browser/dataset";

export class FavoritesShell {
  public readonly root: HTMLElement;
  public readonly workspace: HTMLElement;
  public readonly drawerTrack: HTMLElement;
  public readonly contentPane: HTMLElement;
  public readonly toolbar: HTMLElement;
  public readonly slots: FavoritesToolbarSlots;
  public readonly drawer: FavoritesDrawerSlots;

  constructor(shell: Shell, environment: Environment) {
    const toolbar = FavoritesToolbar.build(environment);
    const drawer = FavoritesDrawer.build();

    this.root = div(FavoritesId.root);
    this.workspace = div(FavoritesId.workspace);
    this.drawerTrack = div(FavoritesId.drawerTrack);
    this.contentPane = div(FavoritesId.contentPane);
    this.toolbar = toolbar.root;
    this.slots = toolbar.slots;
    this.drawer = drawer.slots;
    toggleDataset(this.root, "drawerIconOnly", !FavoritesConfig.drawerSidebarLabelsEnabled);
    shell.root.prepend(this.root);
    this.root.append(this.toolbar, this.workspace);
    this.workspace.append(this.drawerTrack, this.contentPane);
    this.drawerTrack.append(drawer.root);
    this.contentPane.append(shell.scrollSentinelTop, shell.content, shell.scrollSentinelBottom);
  }
}
