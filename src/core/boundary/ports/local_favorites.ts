export interface LocalFavorites {
  getAll: () => Promise<string[]>;
  prepend: (postIds: string[]) => Promise<void>;
  remove: (postIds: string[]) => Promise<void>;
}
