import { AppMode, Environment } from "@/core/boundary/environment";
import { PageName } from "@/adapters/rule34/client/current_page/current_page";
import { Rule34Client } from "@/adapters/rule34/client/client";

const MODES: Record<PageName, AppMode> = {
  favorites: "favorites",
  postList: "posts"
};

type Rule34Place = Pick<Environment, "mode" | "favoritesId" | "ownsFavorites" | "blacklistedTags" | "usingDarkMode">;
type Rule34Page = Pick<Rule34Client, "readPageName" | "readUserId" | "readFavoritesPageId" | "readTagBlacklist" | "readTheme">;

export function readRule34Environment(site: Rule34Page): Rule34Place | null {
  const pageName = site.readPageName();

  if (pageName === null) {
    return null;
  }
  const mode = MODES[pageName];
  const userId = site.readUserId();
  const favoritesPageId = site.readFavoritesPageId();
  return {
    mode,
    favoritesId: mode === "favorites" ? favoritesPageId : userId,
    ownsFavorites: mode === "favorites" && userId === favoritesPageId,
    blacklistedTags: site.readTagBlacklist(),
    usingDarkMode: site.readTheme() === "dark"
  };
}
