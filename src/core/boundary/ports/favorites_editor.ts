export type AddFavoriteResult = "added" | "alreadyAdded" | "loggedOut" | "cancelled" | "error";
export type RemoveFavoriteResult = "removed" | "cancelled" | "error";

export interface FavoritesEditor {
  add: (id: string) => Promise<AddFavoriteResult>;
  remove: (id: string) => Promise<RemoveFavoriteResult>;
}
