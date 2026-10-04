export type AddFavoriteResult = "added" | "alreadyAdded" | "loggedOut" | "cancelled" | "blocked" | "error";
export type RemoveFavoriteResult = "removed" | "cancelled" | "blocked" | "error";

export interface RemoteFavoriteActions {
  add: (id: string) => Promise<AddFavoriteResult>;
  remove: (id: string) => Promise<RemoveFavoriteResult>;
}
