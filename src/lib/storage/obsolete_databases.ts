// Databases whose schema has been superseded by a renamed successor; nothing reads them anymore.
export const OBSOLETE_DATABASES: readonly string[] = ["Favorites", "FavoritesV2", "Posts"];

export function purgeObsoleteDatabases(): void {
  for (const name of OBSOLETE_DATABASES) {
    indexedDB.deleteDatabase(name);
  }
}
