import { AppMode, HostEnvironment } from "@/core/boundary/environment";
import { PageName } from "@/adapters/rule34/client/site/current_page/current_page";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

const MODES: Record<PageName, AppMode> = {
  favorites: "favorites",
  postList: "postList"
};

export function readRule34Environment(rule34: Pick<Rule34SiteClient, "readPageName" | "readUserId" | "readFavoritesPageId" | "readTagBlacklist" | "readTheme">): HostEnvironment | null {
  const pageName = rule34.readPageName();

  if (pageName === null) {
    return null;
  }
  const mode = MODES[pageName];
  const userId = rule34.readUserId();
  const favoritesPageId = rule34.readFavoritesPageId();
  return {
    mode,
    favoritesOwnerId: mode === "favorites" ? favoritesPageId : userId,
    ownsFavorites: mode === "favorites" && userId === favoritesPageId,
    blacklistedTags: rule34.readTagBlacklist(),
    darkTheme: rule34.readTheme() === "dark"
  };
}
