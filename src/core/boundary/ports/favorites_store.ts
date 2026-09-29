export interface FavoritesStore {
  getAll: () => Promise<string[]>;
  prepend: (postIds: string[]) => Promise<void>;
  remove: (postId: string) => Promise<void>;
  clear: () => Promise<void>;
}
