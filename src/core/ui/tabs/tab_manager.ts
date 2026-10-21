import { Readable, Signal } from "@/core/utils/reactive/signal";

export interface Tab<T> {
  readonly id: string;
  readonly value: T;
  readonly closable: boolean;
}

export interface TabOptions {
  readonly closable?: boolean;
}

export interface TabManagerDependencies<T> {
  dispose: (value: T) => void;
}

export class TabManager<T> {
  private readonly currentTabs = new Signal<readonly Tab<T>[]>([]);
  private readonly currentActiveId = new Signal<string | null>(null);

  constructor(private readonly dependencies: TabManagerDependencies<T>) { }

  public get tabs(): Readable<readonly Tab<T>[]> {
    return this.currentTabs;
  }

  public get activeId(): Readable<string | null> {
    return this.currentActiveId;
  }

  public open(id: string, value: T, { closable = true }: TabOptions = {}): Tab<T> {
    if (this.currentTabs.peek().some(tab => tab.id === id)) {
      throw new Error(`Tab already exists: ${id}`);
    }
    const tab = { id, value, closable };

    this.currentTabs.value = [...this.currentTabs.peek(), tab];

    if (this.currentActiveId.peek() === null) {
      this.currentActiveId.value = id;
    }
    return tab;
  }

  public activate(id: string): void {
    if (this.currentTabs.peek().some(tab => tab.id === id)) {
      this.currentActiveId.value = id;
    }
  }

  public close(id: string): void {
    const tabs = this.currentTabs.peek();
    const index = tabs.findIndex(candidate => candidate.id === id);

    if (index === -1 || !tabs[index].closable) {
      return;
    }
    const remaining = tabs.filter(candidate => candidate.id !== id);

    this.currentTabs.value = remaining;

    if (this.currentActiveId.peek() === id) {
      this.currentActiveId.value = (remaining[index] ?? remaining[index - 1])?.id ?? null;
    }
    this.dependencies.dispose(tabs[index].value);
  }
}
