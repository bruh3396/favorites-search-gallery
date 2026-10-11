import { Signal } from "@/core/utils/reactive/signal";

export class LoadGate<T extends { readonly id: string }> {
  public readonly isOpen: Signal<boolean>;
  private readonly versions: Map<string, number>;
  private readonly loadedIds: Set<string>;
  private currentIds: Set<string>;
  private nextVersion: number;

  constructor() {
    this.isOpen = new Signal(false);
    this.currentIds = new Set<string>();
    this.nextVersion = 0;
    this.versions = new Map<string, number>();
    this.loadedIds = new Set<string>();
  }

  public setPosts(items: readonly T[]): void {
    this.currentIds = new Set(items.map(post => post.id));

    for (const id of this.loadedIds) {
      if (!this.currentIds.has(id)) {
        this.loadedIds.delete(id);
      }
    }

    for (const id of this.versions.keys()) {
      if (!this.currentIds.has(id)) {
        this.versions.delete(id);
      }
    }
    this.setGate();
  }

  public onLoaded(id: string): () => void {
    this.nextVersion += 1;
    const version = this.nextVersion;

    this.versions.set(id, version);
    this.loadedIds.delete(id);
    this.setGate();
    return () => {
      if (this.versions.get(id) === version && this.currentIds.has(id)) {
        this.loadedIds.add(id);
        this.setGate();
      }
    };
  }

  private setGate(): void {
    this.isOpen.value = this.currentIds.size > 0 && [...this.currentIds].every(id => this.loadedIds.has(id));
  }
}
