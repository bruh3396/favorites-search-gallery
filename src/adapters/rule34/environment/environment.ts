import { readFavoritesPageId, readPageMode } from "@/adapters/rule34/client/location";
import { PlaceEnvironment } from "@/core/boundary/environment";

export function readRule34Environment(): PlaceEnvironment | null {
  const mode = readPageMode();

  if (mode === null) {
    return null;
  }
  const userId = readRule34UserId();
  const favoritesPageId = readFavoritesPageId();
  return {
    mode,
    favoritesId: mode === "favorites" ? favoritesPageId : userId,
    ownsFavorites: mode === "favorites" && userId === favoritesPageId,
    blacklistedTags: readTagBlacklist(),
    usingDarkMode: readCookie("theme") === "dark"
  };
}

export function readRule34UserId(): string {
  return readCookie("user_id");
}

function readCookie(key: string): string {
  const prefix = `${key}=`;
  const cookie = document.cookie.split(";").map(entry => entry.trimStart()).find(entry => entry.startsWith(prefix));
  return cookie === undefined ? "" : cookie.substring(prefix.length);
}

function readTagBlacklist(): string {
  let tags = readCookie("tag_blacklist");

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
