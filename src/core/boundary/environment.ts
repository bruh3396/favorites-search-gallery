export type AppMode = "favorites" | "posts";
export type Device = "desktop" | "mobile";
export type CanvasBudget = "reduced" | "full";

export interface Environment {
  version: string;
  mode: AppMode;
  favoritesId: string;
  ownsFavorites: boolean;
  blacklistedTags: string;
  usingDarkMode: boolean;
  device: Device;
  canvasBudget: CanvasBudget;
}
