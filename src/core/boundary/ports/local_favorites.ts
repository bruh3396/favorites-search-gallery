export interface LocalFavorites {
  getAll: () => Promise<string[]>;
  prepend: (postIds: string[]) => Promise<void>;
  remove: (postId: string) => Promise<void>;
  clear: () => Promise<void>;
}
