import { Codec, createListCodec, createRecordCodec } from "@/core/utils/codec/codec";
import { DEFAULT_SEARCH_SETTINGS, SEARCH_SETTINGS_GUARDS, SearchSettings } from "@/core/features/favorites/search/inputs";
import { FavoritesTab, createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Tab, TabManager } from "@/core/ui/tabs/tab_manager";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { isRecord } from "@/core/utils/guards/guards";

export interface FavoritesWorkspaceConfiguration {
  readonly favoritesOwnerId: string;
}

export interface FavoritesWorkspaceDependencies {
  storage: LocalKeyedValues;
  createSession: (settings: SearchSettings) => FavoritesSession;
}

interface TabGroup {
  readonly tabs: readonly SearchSettings[];
  readonly activeIndex: number;
}

interface Workspace {
  readonly panes: readonly TabGroup[];
}

const WORKSPACE_NAMESPACE = "favoritesWorkspace";
const DEFAULT_WORKSPACE: Workspace = { panes: [{ tabs: [DEFAULT_SEARCH_SETTINGS], activeIndex: 0 }] };
const TABS_CODEC = createListCodec(createRecordCodec(DEFAULT_SEARCH_SETTINGS, SEARCH_SETTINGS_GUARDS));
const TAB_GROUPS_CODEC = createListCodec<TabGroup>({
  decode: (stored): TabGroup | undefined => {
    if (!isRecord(stored)) {
      return undefined;
    }
    const tabs = TABS_CODEC.decode(stored.tabs);
    return tabs !== undefined && tabs.length > 0 ? { tabs, activeIndex: decodeActiveIndex(stored.activeIndex, tabs.length) } : undefined;
  },
  encode: (tabGroup): unknown => ({ tabs: TABS_CODEC.encode(tabGroup.tabs), activeIndex: tabGroup.activeIndex })
});
const WORKSPACE_CODEC: Codec<Workspace> = {
  decode: (stored): Workspace | undefined => {
    const panes = isRecord(stored) ? TAB_GROUPS_CODEC.decode(stored.panes) : undefined;
    return panes !== undefined && panes.length > 0 ? { panes } : undefined;
  },
  encode: (workspace): unknown => ({ panes: TAB_GROUPS_CODEC.encode(workspace.panes) })
};

export class FavoritesWorkspace {
  public readonly tabManager: TabManager<FavoritesTab>;
  public readonly activeTab: Readable<FavoritesTab>;
  private tabCount: number;
  private readonly stopStartingActiveTab: () => void;
  private readonly stopPersisting: () => void;

  constructor({ favoritesOwnerId }: FavoritesWorkspaceConfiguration, private readonly dependencies: FavoritesWorkspaceDependencies) {
    this.tabManager = new TabManager<FavoritesTab>({ dispose: (tab): void => tab.session.dispose() });
    this.tabCount = 0;
    const workspaces = new NamespacedLocalKeyedValues(WORKSPACE_NAMESPACE, dependencies.storage);
    const { tabs, activeIndex } = (WORKSPACE_CODEC.decode(workspaces.get(favoritesOwnerId)) ?? DEFAULT_WORKSPACE).panes[0];
    const restoredTabs = tabs.map(settings => this.openTab(settings));

    this.tabManager.activate(restoredTabs[activeIndex].id);
    this.activeTab = computed(() => this.findActiveTab().value);
    this.stopStartingActiveTab = effect(() => this.activeTab.value.session.start());
    this.stopPersisting = effect(() => workspaces.set(favoritesOwnerId, WORKSPACE_CODEC.encode(this.createSnapshot())));
  }

  public openBlankTab(): void {
    this.tabManager.activate(this.openTab(DEFAULT_SEARCH_SETTINGS).id);
  }

  public closeTab(id: string): void {
    if (this.tabManager.tabs.peek().length > 1) {
      this.tabManager.close(id);
    }
  }

  public locate(item: Favorite): HTMLElement | undefined {
    return this.activeTab.peek().tileLocator.locate(item);
  }

  public turnToPageContaining(item: Favorite): void {
    this.activeTab.peek().session.goToPageContaining(item);
  }

  public reveal(item: Favorite): HTMLElement | undefined {
    this.turnToPageContaining(item);
    this.activeTab.peek().scrollTo.emit(item);
    return this.locate(item);
  }

  public dispose(): void {
    this.stopStartingActiveTab();
    this.stopPersisting();
  }

  private createSnapshot(): Workspace {
    const tabs = this.tabManager.tabs.value;
    return { panes: [{ tabs: tabs.map(tab => tab.value.session.settings.value), activeIndex: tabs.indexOf(this.findActiveTab()) }] };
  }

  private findActiveTab(): Tab<FavoritesTab> {
    const tabs = this.tabManager.tabs.value;
    return tabs.find(tab => tab.id === this.tabManager.activeId.value) ?? tabs[0];
  }

  private openTab(settings: SearchSettings): Tab<FavoritesTab> {
    this.tabCount += 1;
    return this.tabManager.open(`tab-${this.tabCount}`, createFavoritesTab(this.dependencies.createSession(settings)));
  }
}

function decodeActiveIndex(stored: unknown, tabCount: number): number {
  return typeof stored === "number" && Number.isInteger(stored) && stored >= 0 && stored < tabCount ? stored : 0;
}
