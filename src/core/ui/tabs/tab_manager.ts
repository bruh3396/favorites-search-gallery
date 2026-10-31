import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Tab, TabOptions } from "@/core/ui/tabs/tab";

export interface TabManagerDependencies<T> {
  dispose: (value: T) => void;
}

export class TabManager<T> {
  private readonly currentTabs = new Signal<readonly Tab<T>[]>([]);
  private readonly currentActiveTabId = new Signal<string | null>(null);

  constructor(private readonly dependencies: TabManagerDependencies<T>) { }

  public get tabs(): Readable<readonly Tab<T>[]> {
    return this.currentTabs;
  }

  public get activeTabId(): Readable<string | null> {
    return this.currentActiveTabId;
  }

  public open(tabId: string, value: T, { closable = true }: TabOptions = {}): Tab<T> {
    if (this.currentTabs.peek().some(tab => tab.id === tabId)) {
      throw new Error(`Tab already exists: ${tabId}`);
    }
    const tab = { id: tabId, value, closable };

    this.currentTabs.value = [...this.currentTabs.peek(), tab];

    if (this.currentActiveTabId.peek() === null) {
      this.currentActiveTabId.value = tabId;
    }
    return tab;
  }

  public activate(tabId: string): void {
    if (this.currentTabs.peek().some(tab => tab.id === tabId)) {
      this.currentActiveTabId.value = tabId;
    }
  }

  public move(tabId: string, index: number): void {
    const tabs = this.currentTabs.peek();
    const tab = tabs.find(candidateTab => candidateTab.id === tabId);

    if (tab === undefined || tabs.indexOf(tab) === index) {
      return;
    }
    const remainingTabs = tabs.filter(candidateTab => candidateTab !== tab);

    this.currentTabs.value = [...remainingTabs.slice(0, index), tab, ...remainingTabs.slice(index)];
  }

  public close(tabId: string): void {
    const tabs = this.currentTabs.peek();
    const index = tabs.findIndex(tab => tab.id === tabId);

    if (index === -1 || !tabs[index].closable) {
      return;
    }
    const remainingTabs = tabs.filter(tab => tab.id !== tabId);

    this.currentTabs.value = remainingTabs;

    if (this.currentActiveTabId.peek() === tabId) {
      this.currentActiveTabId.value = (remainingTabs[index] ?? remainingTabs[index - 1])?.id ?? null;
    }
    this.dependencies.dispose(tabs[index].value);
  }
}
