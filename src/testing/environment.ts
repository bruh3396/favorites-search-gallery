import { Environment } from "@/core/boundary/environment";

export function createEnvironment(overrides: Partial<Environment> = {}): Environment {
  return {
    version: "0",
    mode: "favorites",
    device: "desktop",
    canvasBudget: "full",
    favoritesId: "1",
    ownsFavorites: true,
    blacklistedTags: "",
    usingDarkMode: false,
    ...overrides
  };
}
