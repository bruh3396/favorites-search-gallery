import * as FavoritesChangelog from "@/features/favorites/control/sections/changelog";
import * as FavoritesDrawer from "@/features/favorites/control/drawer";
import * as FavoritesHelp from "@/features/favorites/control/sections/help";
import * as FavoritesPagination from "@/features/favorites/control/pagination";
import * as FavoritesSettings from "@/features/favorites/control/sections/settings/settings";
import * as FavoritesToolbar from "@/features/favorites/control/toolbar/toolbar";
import { AppContext } from "@/app/context/context";
import { FavoritesDrawerContents } from "@/types/favorites_ui";
import { FavoritesSearchBox } from "@/features/favorites/control/toolbar/search_box";
import { FavoritesShell } from "@/features/favorites/shell/shell";

export interface FavoritesControlConfiguration {
  offersTutorial: boolean;
}

export interface FavoritesControlDependencies {
  context: AppContext;
  shell: FavoritesShell;
}

export class FavoritesControl {
  private readonly shell: FavoritesShell;
  private readonly searchBox: FavoritesSearchBox;

  constructor({ offersTutorial }: FavoritesControlConfiguration, { context, shell }: FavoritesControlDependencies) {
    const { events, environment, preferences } = context;

    this.shell = shell;

    FavoritesToolbar.setup(events, environment, preferences, shell.toolbar);
    FavoritesDrawer.setup(preferences, shell);
    FavoritesPagination.setup(events, shell.toolbar.pagination);
    this.searchBox = new FavoritesSearchBox(events, shell.toolbar, context.ports.localKeyedValues);
    this.mountDrawerSections({
      settings: FavoritesSettings.buildDrawerSection(context),
      change: FavoritesChangelog.buildDrawerSection(),
      help: FavoritesHelp.buildDrawerSection(offersTutorial, events.gallery.tutorialRequested.emit)
    });
  }

  public mountDrawerSections(contents: FavoritesDrawerContents): void {
    FavoritesDrawer.mount(this.shell, contents);
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
