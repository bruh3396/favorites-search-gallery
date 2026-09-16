export class PostListNavigatorFavoriteIds {
  private readonly ids: Set<string> = new Set();
  private loadPromise: Promise<void> | null = null;

  public ensureLoaded(fetchIds: () => Promise<string[]>): Promise<void> {
    this.loadPromise ??= fetchIds().then(loaded => this.addAll(loaded));
    return this.loadPromise;
  }

  public has(id: string): boolean {
    return this.ids.has(id);
  }

  public add(id: string): void {
    this.ids.add(id);
  }

  public remove(id: string): void {
    this.ids.delete(id);
  }

  private addAll(loaded: string[]): void {
    loaded.forEach(id => this.ids.add(String(id)));
  }
}
