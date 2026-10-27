import { AppMode, HostEnvironment } from "@/core/boundary/environment";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34PageName } from "@/adapters/rule34/document/rule34_page_name";

const MODES: Record<Rule34PageName, AppMode> = {
  favorites: "favorites",
  postList: "postList"
};

export function readRule34Environment(rule34Document: Pick<Rule34Document,
  "readPageName" | "readUserId" | "readFavoritesOwnerId" | "readTagBlacklist" | "readTheme">): HostEnvironment | null {
  const pageName = rule34Document.readPageName();

  if (pageName === null) {
    return null;
  }
  const mode = MODES[pageName];
  const userId = rule34Document.readUserId();
  const favoritesPageOwnerId = rule34Document.readFavoritesOwnerId();
  return {
    mode,
    favoritesOwnerId: mode === "favorites" ? favoritesPageOwnerId : userId,
    ownsFavorites: mode === "favorites" && userId === favoritesPageOwnerId,
    blacklistedTags: rule34Document.readTagBlacklist(),
    colorScheme: rule34Document.readTheme()
  };
}
