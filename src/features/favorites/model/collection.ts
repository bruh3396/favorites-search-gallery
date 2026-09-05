import { Favorite } from "@/types/favorite";

let allFavorites: Favorite[] = [];
const favoritesById: Map<string, Favorite> = new Map<string, Favorite>();

export function setAll(favorites: Favorite[]): void {
  allFavorites = favorites;
  index(favorites);
}

export function append(favorites: Favorite[]): void {
  index(favorites);
  allFavorites.push(...favorites);
}

export function prepend(favorites: Favorite[]): void {
  index(favorites);
  allFavorites.unshift(...favorites);
}

export const getAll = (): Favorite[] => [...allFavorites];
export const get = (id: string): Favorite | undefined => favoritesById.get(id);
export const getAllIds = (): Set<string> => new Set(allFavorites.map(favorite => favorite.id));

const index = (favorites: Favorite[]): void => favorites.forEach(f => favoritesById.set(f.id, f));
