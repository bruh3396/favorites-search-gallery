import { Codec, createListCodec, createRecordCodec } from "@/core/utils/codec/codec";
import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FAVORITES_SEARCH_SETTINGS_GUARDS, FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { Readable, batch, computed, effect } from "@/core/utils/reactive/signal";
import { Tab } from "@/core/ui/tabs/tab";
import { TabManager } from "@/core/ui/tabs/tab_manager";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { isRecord } from "@/core/utils/guard/guard";

export interface FavoritesWorkspaceDependencies {
  favoritesWorkspaceSnapshot: StoredValue<FavoritesWorkspaceSnapshot>;
  createSession: (favoritesSearchSettings: FavoritesSearchSettings) => FavoritesSession;
}

interface TabGroup {
  readonly favoritesSearchSettings: readonly FavoritesSearchSettings[];
  readonly activeIndex: number;
}

export interface FavoritesWorkspaceSnapshot {
  readonly tabGroups: readonly TabGroup[];
}

export const DEFAULT_FAVORITES_WORKSPACE_SNAPSHOT: FavoritesWorkspaceSnapshot = { tabGroups: [{ favoritesSearchSettings: [DEFAULT_FAVORITES_SEARCH_SETTINGS], activeIndex: 0 }] };
const TABS_CODEC = createListCodec(createRecordCodec(DEFAULT_FAVORITES_SEARCH_SETTINGS, FAVORITES_SEARCH_SETTINGS_GUARDS));
const TAB_GROUPS_CODEC = createListCodec<TabGroup>({
  decode: (stored): TabGroup | undefined => {
    if (!isRecord(stored)) {
      return undefined;
    }
    const favoritesSearchSettings = TABS_CODEC.decode(stored.favoritesSearchSettings);
    return favoritesSearchSettings !== undefined && favoritesSearchSettings.length > 0 ? { favoritesSearchSettings, activeIndex: decodeActiveIndex(stored.activeIndex, favoritesSearchSettings.length) } : undefined;
  },
  encode: (tabGroup): unknown => ({ favoritesSearchSettings: TABS_CODEC.encode(tabGroup.favoritesSearchSettings), activeIndex: tabGroup.activeIndex })
});

export const FAVORITES_WORKSPACE_SNAPSHOT_CODEC: Codec<FavoritesWorkspaceSnapshot> = {
  decode: (stored): FavoritesWorkspaceSnapshot | undefined => {
    const tabGroups = isRecord(stored) ? TAB_GROUPS_CODEC.decode(stored.tabGroups) : undefined;
    return tabGroups !== undefined && tabGroups.length > 0 ? { tabGroups } : undefined;
  },
  encode: (favoritesWorkspaceSnapshot): unknown => ({ tabGroups: TAB_GROUPS_CODEC.encode(favoritesWorkspaceSnapshot.tabGroups) })
};

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
    const restoredTabs = tabGroup.favoritesSearchSettings.map(favoritesSearchSettings => this.openTab(favoritesSearchSettings));

    this.tabManager.activate(restoredTabs[tabGroup.activeIndex].id);
    this.activeTab = computed(() => this.findActiveTab().value);
    this.stopStartingActiveTab = effect(() => this.activeTab.value.session.start());
    this.stopPersisting = effect(() => dependencies.favoritesWorkspaceSnapshot.set(this.createSnapshot()));
  }

  public openBlankTab(): void {
    const tab = this.openTab(DEFAULT_FAVORITES_SEARCH_SETTINGS);

    this.tabManager.activate(tab.id);
    tab.value.focusSearch.emit();
  }

  public closeTab(tabId: string): void {
    if (this.tabManager.tabs.peek().length > 1) {
      this.tabManager.close(tabId);
    }
  }

  public closeAllTabs(): void {
    const previousTabs = this.tabManager.tabs.peek();

    this.openBlankTab();
    batch(() => previousTabs.forEach(tab => this.tabManager.close(tab.id)));
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
    return { tabGroups: [{ favoritesSearchSettings: tabs.map(tab => tab.value.session.searchSettings.value), activeIndex: tabs.indexOf(this.findActiveTab()) }] };
  }

  private findActiveTab(): Tab<FavoritesTab> {
    const tabs = this.tabManager.tabs.value;
    return tabs.find(tab => tab.id === this.tabManager.activeTabId.value) ?? tabs[0];
  }

  private openTab(favoritesSearchSettings: FavoritesSearchSettings): Tab<FavoritesTab> {
    this.tabCount += 1;
    return this.tabManager.open(`tab-${this.tabCount}`, createFavoritesTab(this.dependencies.createSession(favoritesSearchSettings)));
  }
}

function decodeActiveIndex(stored: unknown, tabCount: number): number {
  return typeof stored === "number" && Number.isInteger(stored) && stored >= 0 && stored < tabCount ? stored : 0;
}
