export type AppMode = "favorites" | "postList";
export type Device = "desktop" | "mobile";
export type Pointer = "hover" | "touch";
export type CanvasBudget = "reduced" | "full";
export type ColorScheme = "light" | "dark";

export interface HostEnvironment {
  readonly mode: AppMode;
  readonly favoritesOwnerId: string;
  readonly ownsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
  readonly colorScheme: ColorScheme;
}

export interface RuntimeEnvironment {
  readonly device: Device;
  readonly pointer: Pointer;
  readonly canvasBudget: CanvasBudget;
}

export interface Environment extends HostEnvironment, RuntimeEnvironment {
  readonly version: string;
}
