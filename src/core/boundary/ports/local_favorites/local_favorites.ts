export interface LocalFavorites {
  getAll: () => Promise<string[]>;
  setAll: (postIds: string[]) => Promise<void>;
  prepend: (postIds: string[]) => Promise<void>;
  remove: (postIds: string[]) => Promise<void>;
}
