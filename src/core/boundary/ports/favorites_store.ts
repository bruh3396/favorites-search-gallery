export interface FavoritesStore {
  getAll: () => Promise<string[]>;
  prepend: (ids: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}
