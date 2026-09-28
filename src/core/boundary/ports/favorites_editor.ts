export type AddFavoriteResult = "error" | "alreadyAdded" | "loggedOut" | "added";
export type RemoveFavoriteResult = "error" | "forbidden" | "removed";

export interface FavoritesEditor {
  add: (id: string) => Promise<AddFavoriteResult>;
  remove: (id: string) => Promise<RemoveFavoriteResult>;
}
