import { negateTags } from "@/utils/pure/tag";
import { readCookie } from "@/utils/browser/cookie";
import { readQueryParam } from "@/utils/browser/window";

declare const SCRIPT_VERSION: string;

export interface Environment {
  version: string;
  onFavoritesPage: boolean;
  onPostListPage: boolean;
  onPostPage: boolean;
  onFirstFavoritesPage: boolean;
  usingFirefox: boolean;
  onMobileDevice: boolean;
  onDesktopDevice: boolean;
  platform: "mobile" | "desktop";
  userId: string;
  favoritesPageId: string | null;
  userIsOnTheirOwnFavoritesPage: boolean;
  blacklistedTags: string;
  negatedBlacklistedTags: string;
  usingDarkMode: boolean;
}

export function readEnvironment(): Environment {
  const url = location.href;
  const agent = navigator.userAgent;
  const onFavoritesPage = url.includes("page=favorites");
  const onMobileDevice = (/iPhone|iPad|iPod|Android/i).test(agent);
  const userId = readCookie("user_id");
  const favoritesPageId = readQueryParam("id");
  const blacklistedTags = readTagBlacklist();
  return {
    version: SCRIPT_VERSION,
    onFavoritesPage,
    onPostListPage: url.includes("page=post&s=list"),
    onPostPage: url.includes("page=post&s=view"),
    onFirstFavoritesPage: onFavoritesPage && (readQueryParam("pid") === null || readQueryParam("pid") === "0"),
    usingFirefox: agent.toLowerCase().includes("firefox"),
    onMobileDevice,
    onDesktopDevice: !onMobileDevice,
    platform: onMobileDevice ? "mobile" : "desktop",
    userId,
    favoritesPageId,
    userIsOnTheirOwnFavoritesPage: userId === favoritesPageId,
    blacklistedTags,
    negatedBlacklistedTags: negateTags(blacklistedTags),
    usingDarkMode: readCookie("theme") === "dark"
  };
}

function readTagBlacklist(): string {
  let tags = readCookie("tag_blacklist");

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
