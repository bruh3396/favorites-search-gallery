import { AppMode, HostEnvironment } from "@/core/boundary/environment";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34PageName } from "@/adapters/rule34/client/current_page";

const MODES: Record<Rule34PageName, AppMode> = {
  favorites: "favorites",
  postList: "postList"
};

export function readRule34Environment(rule34: Pick<Rule34Client,
  "readPageName" | "readUserId" | "readFavoritesPageId" | "readTagBlacklist" | "readTheme">): HostEnvironment | null {
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
    colorScheme: rule34.readTheme()
  };
}
