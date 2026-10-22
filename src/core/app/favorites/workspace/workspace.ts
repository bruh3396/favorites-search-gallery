import { DEFAULT_SEARCH_SETTINGS, SearchSettings } from "@/core/features/favorites/search/inputs";
import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Tab, TabManager } from "@/core/ui/tabs/tab_manager";
import { persistWorkspace, restoreWorkspace } from "@/core/app/favorites/workspace/stored_workspace";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";

export interface FavoritesWorkspaceConfiguration {
  readonly favoritesOwnerId: string;
}

export interface FavoritesWorkspaceDependencies {
  storage: LocalKeyedValues;
  createSession: (searchSettings: SearchSettings) => FavoritesSearchSession;
}

export class FavoritesWorkspace {
  public readonly tabManager = new TabManager<FavoritesTab>({ dispose: (tab): void => tab.session.dispose() });
  public readonly activeTab: Readable<FavoritesTab>;
  private tabCount = 0;

  constructor({ favoritesOwnerId }: FavoritesWorkspaceConfiguration, private readonly dependencies: FavoritesWorkspaceDependencies) {
    const { tabs, activeIndex } = restoreWorkspace(dependencies.storage, favoritesOwnerId).panes[0];
    const restoredTabs = tabs.map(settings => this.openTab(settings));

    this.tabManager.activate(restoredTabs[activeIndex].id);
    this.activeTab = computed(() => this.findActiveTab().value);
    effect(() => this.activeTab.value.session.start());
    persistWorkspace(dependencies.storage, favoritesOwnerId, computed(() => ({
      panes: [
        {
          tabs: this.tabManager.tabs.value.map(tab => tab.value.session.settings.value),
          activeIndex: this.tabManager.tabs.value.indexOf(this.findActiveTab())
        }
      ]
    })));
  }

  public openBlankTab(): void {
    this.tabManager.activate(this.openTab(DEFAULT_SEARCH_SETTINGS).id);
  }

  public closeTab(id: string): void {
    if (this.tabManager.tabs.peek().length > 1) {
      this.tabManager.close(id);
    }
  }

  private findActiveTab(): Tab<FavoritesTab> {
    const tabs = this.tabManager.tabs.value;
    return tabs.find(tab => tab.id === this.tabManager.activeId.value) ?? tabs[0];
  }

  private openTab(searchSettings: SearchSettings): Tab<FavoritesTab> {
    this.tabCount += 1;
    return this.tabManager.open(`tab-${this.tabCount}`, createFavoritesTab(this.dependencies.createSession(searchSettings)));
  }
}
