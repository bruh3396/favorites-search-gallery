import { Environment } from "@/core/boundary/environment";

export function createEnvironment(overrides: Partial<Environment> = {}): Environment {
  return {
    version: "0",
    mode: "favorites",
    device: "desktop",
    pointer: "hover",
    canvasBudget: "full",
    favoritesOwnerId: "1",
    ownsFavorites: true,
    blacklistedTags: "",
    colorScheme: "light",
    ...overrides
  };
}
