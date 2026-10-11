export interface LocalFavorites {
  getAll: () => Promise<readonly string[]>;
  setAll: (postIds: readonly string[]) => Promise<void>;
  prepend: (postIds: readonly string[]) => Promise<void>;
  remove: (postIds: readonly string[]) => Promise<void>;
}
