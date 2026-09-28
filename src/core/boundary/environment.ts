export type AppMode = "favorites" | "posts";
export type Device = "desktop" | "mobile";
export type CanvasBudget = "reduced" | "full";

export interface Place {
  mode: AppMode;
  favoritesId: string;
  ownsFavorites: boolean;
  blacklistedTags: string;
  usingDarkMode: boolean;
}

export interface Runtime {
  device: Device;
  canvasBudget: CanvasBudget;
}

export interface Environment extends Place, Runtime {
  version: string;
}
