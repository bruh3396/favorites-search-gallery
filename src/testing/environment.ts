import { Environment } from "@/app/context/environment";

export function createEnvironment(overrides: Partial<Environment> = {}): Environment {
  return {
    version: "0",
    onFavoritesPage: true,
    onPostListPage: false,
    onFirstFavoritesPage: true,
    usingFirefox: false,
    onMobileDevice: false,
    onDesktopDevice: true,
    platform: "desktop",
    userId: "1",
    favoritesPageId: "1",
    userIsOnTheirOwnFavoritesPage: true,
    blacklistedTags: "",
    negatedBlacklistedTags: "",
    usingDarkMode: false,
    ...overrides
  };
}
