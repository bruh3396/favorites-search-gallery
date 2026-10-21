import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites_page/workspace/favorites_tab";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Tab, TabManager, TabOptions } from "@/core/ui/tabs/tab_manager";
import { persistWorkspace, restoreWorkspace } from "@/core/app/favorites_page/workspace/stored_workspace";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { SearchSettings } from "@/core/features/favorites/search/inputs";

export interface FavoritesWorkspaceConfiguration {
  readonly favoritesOwnerId: string;
}

export interface FavoritesWorkspaceDependencies {
  storage: LocalKeyedValues;
  createSession: (searchSettings: SearchSettings) => FavoritesSearchSession;
}

export class FavoritesWorkspace {
  public readonly tabs = new TabManager<FavoritesTab>({ dispose: (tab): void => tab.session.dispose() });
  public readonly homeTab: FavoritesTab;
  public readonly activeTab: Readable<FavoritesTab>;
  private tabCount = 0;

  constructor({ favoritesOwnerId }: FavoritesWorkspaceConfiguration, private readonly dependencies: FavoritesWorkspaceDependencies) {
    const [homeSettings, ...restoredTabs] = restoreWorkspace(dependencies.storage, favoritesOwnerId).panes[0].tabs;

    this.homeTab = this.openTab({ ...homeSettings, query: "" }, { closable: false }).value;
    restoredTabs.forEach(settings => this.openTab(settings));
    this.activeTab = computed(() => this.tabs.tabs.value.find(tab => tab.id === this.tabs.activeId.value)?.value ?? this.homeTab);
    effect(() => this.activeTab.value.session.start());
    persistWorkspace(dependencies.storage, favoritesOwnerId, computed(() => ({
      panes: [{ tabs: this.tabs.tabs.value.map(tab => tab.value.session.settings.value) }]
    })));
  }

  public search(tab: FavoritesTab, query: string): void {
    if (tab !== this.homeTab) {
      tab.session.submit(query);
      return;
    }

    if (query.trim() !== "") {
      this.tabs.activate(this.openTab({ ...this.homeTab.session.settings.peek(), query, isShuffled: false }).id);
    }
  }

  private openTab(searchSettings: SearchSettings, options?: TabOptions): Tab<FavoritesTab> {
    this.tabCount += 1;
    return this.tabs.open(`tab-${this.tabCount}`, createFavoritesTab(this.dependencies.createSession(searchSettings)), options);
  }
}
