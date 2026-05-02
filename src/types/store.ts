export interface Store {
  get<V>(key: string): V | null;
  set<V>(key: string, value: V): void;
  remove(key: string): void;
  keys(): string[];
  clear(): void;
}
