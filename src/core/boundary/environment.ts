export type AppMode = "favorites" | "posts";
export type Device = "desktop" | "mobile";
export type CanvasBudget = "reduced" | "full";

export interface PlaceEnvironment {
  mode: AppMode;
  favoritesId: string;
  ownsFavorites: boolean;
  blacklistedTags: string;
  usingDarkMode: boolean;
}

export interface RuntimeEnvironment {
  device: Device;
  canvasBudget: CanvasBudget;
}

export interface Environment extends PlaceEnvironment, RuntimeEnvironment {
  version: string;
}
