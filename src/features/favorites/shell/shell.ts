import * as FavoritesDrawer from "@/features/favorites/shell/drawer";
import * as FavoritesToolbar from "@/features/favorites/shell/toolbar";
import { FavoritesDrawerSlots, FavoritesToolbarSlots } from "@/types/favorites_ui";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";

export interface FavoritesShellConfiguration {
  version: string;
}

export class FavoritesShell {
  public readonly root: HTMLElement;
  public readonly workspace: HTMLElement;
  public readonly drawerTrack: HTMLElement;
  public readonly contentPane: HTMLElement;
  public readonly toolbarRoot: HTMLElement;
  public readonly toolbar: FavoritesToolbarSlots;
  public readonly drawer: FavoritesDrawerSlots;

  constructor({ version }: FavoritesShellConfiguration, shell: Shell) {
    const toolbar = FavoritesToolbar.build(version);
    const drawer = FavoritesDrawer.build();

    this.root = div(FavoritesId.root);
    this.workspace = div(FavoritesId.workspace);
    this.drawerTrack = div(FavoritesId.drawerTrack);
    this.contentPane = div(FavoritesId.contentPane);
    this.toolbarRoot = toolbar.root;
    this.toolbar = toolbar.slots;
    this.drawer = drawer.slots;
    shell.root.prepend(this.root);
    this.root.append(this.toolbarRoot, this.workspace);
    this.workspace.append(this.drawerTrack, this.contentPane);
    this.drawerTrack.append(drawer.root);
    this.contentPane.append(shell.scrollSentinelTop, shell.content, shell.scrollSentinelBottom);
  }
}
