export type AppMode = "favorites" | "postList";
export type Device = "desktop" | "mobile";
export type Pointer = "hover" | "touch";
export type CanvasBudget = "reduced" | "full";
export type ColorScheme = "light" | "dark";

export interface HostEnvironment {
  mode: AppMode;
  favoritesOwnerId: string;
  ownsFavorites: boolean;
  blacklistedTags: string;
  colorScheme: ColorScheme;
}

export interface RuntimeEnvironment {
  device: Device;
  pointer: Pointer;
  canvasBudget: CanvasBudget;
}

export interface Environment extends HostEnvironment, RuntimeEnvironment {
  version: string;
}
