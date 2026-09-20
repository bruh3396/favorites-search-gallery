import * as FavoritesToolbar from "@/features/favorites/control/toolbar/toolbar";
import { AppContext } from "@/app/context/context";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { FavoritesToolbarSlots } from "@/features/favorites/types/types";
import { SearchBox } from "@/features/favorites/control/toolbar/search_box";
import { mount as mountSettingsView } from "@/features/favorites/control/settings/settings";

export class FavoritesControl {
  private searchBox: SearchBox | null = null;

  constructor(private readonly context: AppContext) {}

  public setup(slots: FavoritesToolbarSlots): void {
    const { events, environment, preferences } = this.context;

    FavoritesToolbar.setup(events, environment, preferences, slots);
    this.searchBox = new SearchBox(events, slots);
  }

  public appendToSearch(text: string): void {
    this.searchBox?.append(text);
  }

  public excludeFromSearch(tag: string): void {
    this.searchBox?.append(`-${tag}`);
  }

  public runSearch(query: string): void {
    this.searchBox?.search(query);
  }

  public clearSearch(): void {
    this.searchBox?.clear();
  }

  public handleSearchButtonClicked(event: MouseEvent): void {
    this.searchBox?.handleSearchButtonClicked(event);
  }

  public mountSettings(): FavoritesDrawerViewContent {
    return mountSettingsView(this.context);
  }
}
