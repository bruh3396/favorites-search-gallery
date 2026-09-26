import * as FavoritesToolbar from "@/features/favorites/view/shell/toolbar";
import { Environment } from "@/app/context/environment";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { FavoritesToolbarSlots } from "@/features/favorites/types/types";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";

export class FavoritesShell {
  public readonly root = div(FavoritesId.root);
  public readonly workspace = div(FavoritesId.workspace);
  public readonly drawerTrack = div(FavoritesId.drawerTrack);
  public readonly contentPane = div(FavoritesId.contentPane);
  private toolbarSlots: FavoritesToolbarSlots | null = null;
  private toolbarRoot: HTMLElement | null = null;

  constructor(
    private readonly shell: Shell,
    private readonly environment: Environment
  ) { }

  public setup(): void {
    const toolbar = FavoritesToolbar.build(this.environment);

    this.shell.root.prepend(this.root);
    this.root.append(toolbar.root);
    this.root.append(this.workspace);
    this.workspace.append(this.drawerTrack, this.contentPane);
    this.contentPane.append(this.shell.scrollSentinelTop, this.shell.content, this.shell.scrollSentinelBottom);
    this.toolbarSlots = toolbar.slots;
    this.toolbarRoot = toolbar.root;
  }

  public getToolbarSlots(): FavoritesToolbarSlots {
    if (this.toolbarSlots === null) {
      throw new Error("Toolbar slots requested before shell setup");
    }
    return this.toolbarSlots;
  }

  public getToolbar(): HTMLElement | null {
    return this.toolbarRoot;
  }
}
