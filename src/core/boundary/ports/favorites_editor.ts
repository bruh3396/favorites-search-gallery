export type AddFavoriteStatus = "error" | "alreadyAdded" | "loggedOut" | "success";
export type RemoveFavoriteStatus = "error" | "forbidden" | "success";

export interface FavoritesEditor {
  add: (id: string) => Promise<AddFavoriteStatus>;
  remove: (id: string) => Promise<RemoveFavoriteStatus>;
}
