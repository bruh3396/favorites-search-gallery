import * as FavoritesChangelog from "@/features/favorites/control/panels/changelog";
import * as FavoritesDrawer from "@/features/favorites/control/drawer";
import * as FavoritesHelp from "@/features/favorites/control/panels/help";
import * as FavoritesPagination from "@/features/favorites/control/pagination";
import * as FavoritesSettings from "@/features/favorites/control/panels/settings/settings";
import * as FavoritesToolbar from "@/features/favorites/control/toolbar/toolbar";
import { AppContext } from "@/app/context/context";
import { FavoritesDrawerViewMap } from "@/types/favorite";
import { FavoritesSearchBox } from "@/features/favorites/control/toolbar/search_box";
import { FavoritesShell } from "@/features/favorites/shell/shell";

export class FavoritesControl {
  private readonly searchBox: FavoritesSearchBox;

  constructor(context: AppContext, private readonly shell: FavoritesShell) {
    const { events, environment, preferences } = context;

    FavoritesToolbar.setup(events, environment, preferences, shell.slots);
    FavoritesDrawer.setup(preferences, shell);
    FavoritesPagination.setup(events, shell.slots.pagination);
    this.searchBox = new FavoritesSearchBox(events, shell.slots);
    this.mountDrawerViews({
      settings: FavoritesSettings.mount(context),
      change: FavoritesChangelog.buildDrawerView(),
      help: FavoritesHelp.buildDrawerView(environment, events.gallery.showControlsRequested.emit)
    });
  }

  public mountDrawerViews(views: FavoritesDrawerViewMap): void {
    FavoritesDrawer.mount(this.shell, views);
  }

  public appendToSearch(text: string): void {
    this.searchBox.append(text);
  }

  public excludeFromSearch(tag: string): void {
    this.searchBox.append(`-${tag}`);
  }

  public runSearch(query: string): void {
    this.searchBox.search(query);
  }

  public clearSearch(): void {
    this.searchBox.clear();
  }

  public handleSearchButtonClicked(event: MouseEvent): void {
    this.searchBox.handleSearchButtonClicked(event);
  }
}
