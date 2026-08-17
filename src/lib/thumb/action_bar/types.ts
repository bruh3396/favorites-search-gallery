export type ActionBarAction = "favorite" | "download";

export interface ActionBarCallbacks {
  onFavoriteAdded: (id: string) => void;
  onFavoriteRemoved: (id: string) => void;
}
