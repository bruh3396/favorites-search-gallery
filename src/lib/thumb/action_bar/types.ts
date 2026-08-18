export type ActionBarAction = "favorite" | "download";

export enum ActionBarButton {
  Favorite = 1,
  Download = 2
}

export type ActionBarMode = "off" | "hover" | "always";

export type ActionBarStyle = "corner" | "opaque" | "inset";

export interface ActionBarCallbacks {
  onFavoriteAdded: (id: string) => void;
  onFavoriteRemoved: (id: string) => void;
}
