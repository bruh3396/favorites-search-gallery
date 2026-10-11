import { Readable, Signal } from "@/core/utils/reactive/signal";

export interface Tab<T> {
  readonly id: string;
  readonly value: T;
}

export interface TabManagerDependencies<T> {
  dispose: (value: T) => void;
}

export class TabManager<T> {
  private readonly currentTabs = new Signal<readonly Tab<T>[]>([]);

  constructor(private readonly dependencies: TabManagerDependencies<T>) { }

  public get tabs(): Readable<readonly Tab<T>[]> {
    return this.currentTabs;
  }

  public open(id: string, value: T): void {
    if (this.currentTabs.peek().some(tab => tab.id === id)) {
      throw new Error(`Tab already exists: ${id}`);
    }
    this.currentTabs.value = [...this.currentTabs.peek(), { id, value }];
  }

  public close(id: string): void {
    const tab = this.currentTabs.peek().find(candidate => candidate.id === id);

    if (tab === undefined) {
      return;
    }
    this.currentTabs.value = this.currentTabs.peek().filter(candidate => candidate.id !== id);
    this.dependencies.dispose(tab.value);
  }
}
