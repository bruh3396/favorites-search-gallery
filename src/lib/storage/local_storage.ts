export interface Store {
  get<V>(key: string): V | null;
  set<V>(key: string, value: V): void;
  remove(key: string): void;
  keys(): string[];
  clear(persistent?: ReadonlySet<string>): void;
}

export class LocalStorage implements Store {
  public get<V>(key: string): V | null {
    const item = localStorage.getItem(key);

    if (item === null) {
      return null;
    }
    try {
      return JSON.parse(item) as V;
    } catch {
      return item as unknown as V;
    }
  }

  public set<V>(key: string, value: V): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  public remove(key: string): void {
    localStorage.removeItem(key);
  }

  public keys(): string[] {
    return Object.keys(localStorage);
  }

  public clear(persistent?: Set<string>): void {
    if (persistent === undefined) {
      localStorage.clear();
      return;
    }
    this.keys().filter(key => !persistent.has(key)).forEach(key => this.remove(key));
  }
}

export const Storage: Store = new LocalStorage();
