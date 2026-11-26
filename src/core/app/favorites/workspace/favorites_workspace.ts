import { DEFAULT_FAVORITES_SEARCH_OPTIONS, FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { Readable, batch, computed, effect } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesWorkspaceSnapshot } from "@/core/app/favorites/workspace/favorites_workspace_snapshot";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { Tab } from "@/core/ui/components/tabs/tab";
import { TabManager } from "@/core/ui/components/tabs/tab_manager";
import { randomUint32 } from "@/core/utils/random/random_utilities";

export interface FavoritesWorkspaceDependencies {
  favoritesWorkspaceSnapshot: StoredValue<FavoritesWorkspaceSnapshot>;
  createSession: (favoritesSearchOptions: FavoritesSearchOptions) => FavoritesSession;
  randomSource: RandomSource;
}

export class FavoritesWorkspace {
  public readonly tabManager: TabManager<FavoritesTab>;
  public readonly activeTab: Readable<FavoritesTab>;
  private tabCount: number;
  private readonly stopStartingActiveTab: () => void;
  private readonly stopPersisting: () => void;

  constructor(private readonly dependencies: FavoritesWorkspaceDependencies) {
    this.tabManager = new TabManager<FavoritesTab>({ dispose: (favoritesTab): void => favoritesTab.session.dispose() });
    this.tabCount = 0;
    const tabGroup = dependencies.favoritesWorkspaceSnapshot.peek().tabGroups[0];
    const restoredTabs = tabGroup.favoritesSearchOptions.map(favoritesSearchOptions => this.openTab(favoritesSearchOptions));

    this.tabManager.activate(restoredTabs[tabGroup.activeIndex].id);
    this.activeTab = computed(() => this.findActiveTab().value);
    this.stopStartingActiveTab = effect(() => this.activeTab.value.session.start());
    this.stopPersisting = effect(() => dependencies.favoritesWorkspaceSnapshot.set(this.createSnapshot()));
  }

  public openBlankTab(): void {
    const tab = this.openTab(this.createSearchOptions(DEFAULT_FAVORITES_SEARCH_OPTIONS.query));

    this.tabManager.activate(tab.id);
    tab.value.focusSearch.emit();
  }

  public searchInNewTab(query: string): void {
    this.tabManager.activate(this.openTab(this.createSearchOptions(query)).id);
  }

  public duplicateTab(tabId: string): void {
    const tabs = this.tabManager.tabs.peek();
    const index = tabs.findIndex(tab => tab.id === tabId);
    const tab = this.openTab(tabs[index].value.session.searchOptions.peek());

    this.tabManager.move(tab.id, index + 1);
    this.tabManager.activate(tab.id);
  }

  public closeTabs(tabIds: readonly string[]): void {
    if (this.tabManager.tabs.peek().every(tab => tabIds.includes(tab.id))) {
      this.openBlankTab();
    }
    batch(() => tabIds.forEach(tabId => this.tabManager.close(tabId)));
  }

  public locate(favorite: Favorite): HTMLElement | undefined {
    return this.activeTab.peek().tileLocator.locate(favorite);
  }

  public turnToPageContaining(favorite: Favorite): void {
    this.activeTab.peek().session.goToPageContaining(favorite);
  }

  public reveal(favorite: Favorite): HTMLElement | undefined {
    this.turnToPageContaining(favorite);
    const tile = this.locate(favorite);

    tile?.scrollIntoView({ block: "center", behavior: "instant" });
    return tile;
  }

  public dispose(): void {
    this.stopStartingActiveTab();
    this.stopPersisting();
  }

  private createSnapshot(): FavoritesWorkspaceSnapshot {
    const tabs = this.tabManager.tabs.value;
    return {
      tabGroups: [
        {
          favoritesSearchOptions: tabs.map(tab => tab.value.session.searchOptions.value),
          activeIndex: tabs.indexOf(this.findActiveTab())
        }
      ]
    };
  }

  private findActiveTab(): Tab<FavoritesTab> {
    const tabs = this.tabManager.tabs.value;
    return tabs.find(tab => tab.id === this.tabManager.activeTabId.value) ?? tabs[0];
  }

  private createSearchOptions(query: string): FavoritesSearchOptions {
    return { ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query, shuffleSeed: randomUint32(this.dependencies.randomSource) };
  }

  private openTab(favoritesSearchOptions: FavoritesSearchOptions): Tab<FavoritesTab> {
    this.tabCount += 1;
    return this.tabManager.open(`tab-${this.tabCount}`, createFavoritesTab(this.dependencies.createSession(favoritesSearchOptions)));
  }
}
