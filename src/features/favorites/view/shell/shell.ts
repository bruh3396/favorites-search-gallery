import * as FavoritesToolbar from "@/features/favorites/view/shell/toolbar";
import CHANGELOG_CSS from "@/assets/css/favorites/changelog.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/drawer_panels.css";
import { Environment } from "@/app/context/environment";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { FavoritesToolbarSlots } from "@/features/favorites/types/types";
import HELP_CSS from "@/assets/css/favorites/help.css";
import PAGINATION_CSS from "@/assets/css/favorites/pagination.css";
import SEARCH_FIELD_CSS from "@/assets/css/favorites/search_field.css";
import SETTINGS_PANEL_CSS from "@/assets/css/favorites/settings_panel.css";
import SNIPPETS_CSS from "@/assets/css/favorites/snippets.css";
import { Shell } from "@/app/context/shell";
import TOOLBAR_CSS from "@/assets/css/favorites/toolbar.css";
import { div } from "@/utils/browser/element";
import { insertStyle } from "@/utils/browser/injector";

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
    insertStyle(TOOLBAR_CSS + SEARCH_FIELD_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS + SETTINGS_PANEL_CSS + SNIPPETS_CSS + HELP_CSS + CHANGELOG_CSS, "favorites-ui");
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
