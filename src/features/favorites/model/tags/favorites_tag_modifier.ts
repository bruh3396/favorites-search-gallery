import { Database } from "../../../../lib/core/storage/database";
import { Favorite } from "../../../../types/favorite";
import { FavoritesSearchEngine } from "../search/favorites_search_engine";
import { TagModificationDatabaseRecord } from "../../../../types/search";
import { clearCustomTags } from "./favorites_custom_tags";

export const tagModifications: Map<string, string> = new Map();
const database = new Database<TagModificationDatabaseRecord>("AdditionalTags", "additionalTags", 12);

export async function loadTagModifications(): Promise<void> {
  (await database.load()).forEach(record => tagModifications.set(record.id, record.tags));
}

export function getAdditionalTags(id: string): string | undefined {
  return tagModifications.get(id);
}

export function storeTagModifications(): void {
  database.update(getDatabaseRecords());
}

function getDatabaseRecords(): TagModificationDatabaseRecord[] {
  return Array.from(tagModifications.entries())
    .map((entry) => ({ id: entry[0], tags: entry[1] }));
}

export function addTagsToFavorite(favorite: Favorite, tags: string): string {
  FavoritesSearchEngine.remove(favorite);
  const result = favorite.addAdditionalTags(tags);

  FavoritesSearchEngine.add(favorite);
  return result;
}

export function removeTagsFromFavorite(favorite: Favorite, tags: string): string {
  FavoritesSearchEngine.remove(favorite);
  const result = favorite.removeAdditionalTags(tags);

  FavoritesSearchEngine.add(favorite);
  return result;
}

export function resetFavoriteTags(favorite: Favorite): void {
  FavoritesSearchEngine.remove(favorite);
  favorite.resetAdditionalTags();
  FavoritesSearchEngine.add(favorite);
}

export function resetAllFavoriteTags(favorites: Favorite[]): void {
  for (const favorite of favorites) {
    resetFavoriteTags(favorite);
  }
}

export function resetTagModifications(): void {
  indexedDB.deleteDatabase("AdditionalTags");
  clearCustomTags();
}
