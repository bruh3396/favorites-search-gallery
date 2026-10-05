import { AppMode, HostEnvironment } from "@/core/boundary/environment";
import { Rule34Document, Rule34PageName } from "@/adapters/rule34/document/document";

const MODES: Record<Rule34PageName, AppMode> = {
  favorites: "favorites",
  postList: "postList"
};

export function readRule34Environment(rule34Document: Pick<Rule34Document,
  "readPageName" | "readUserId" | "readFavoritesPageId" | "readTagBlacklist" | "readTheme">): HostEnvironment | null {
  const pageName = rule34Document.readPageName();

  if (pageName === null) {
    return null;
  }
  const mode = MODES[pageName];
  const userId = rule34Document.readUserId();
  const favoritesPageId = rule34Document.readFavoritesPageId();
  return {
    mode,
    favoritesOwnerId: mode === "favorites" ? favoritesPageId : userId,
    ownsFavorites: mode === "favorites" && userId === favoritesPageId,
    blacklistedTags: rule34Document.readTagBlacklist(),
    colorScheme: rule34Document.readTheme()
  };
}
