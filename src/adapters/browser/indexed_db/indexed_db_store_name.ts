export const INDEXED_DB_STORES = {
  favorites: {},
  posts: { keyPath: "id" },
  snippets: { keyPath: "name" },
  tagCategories: {}
} satisfies Record<string, IDBObjectStoreParameters>;

export type IndexedDbStoreName = keyof typeof INDEXED_DB_STORES;
