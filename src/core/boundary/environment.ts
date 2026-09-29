export type AppMode = "favorites" | "postList";
export type Device = "desktop" | "mobile";
export type CanvasBudget = "reduced" | "full";

export interface HostEnvironment {
  mode: AppMode;
  favoritesOwnerId: string;
  ownsFavorites: boolean;
  blacklistedTags: string;
  darkTheme: boolean;
}

export interface RuntimeEnvironment {
  device: Device;
  canvasBudget: CanvasBudget;
}

export interface Environment extends HostEnvironment, RuntimeEnvironment {
  version: string;
}
