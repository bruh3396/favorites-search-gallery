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
  const onPostListPage = url.includes("page=post&s=list");
  const favoritesPageId = readQueryParam("id");
  const onOwnFavoritesPage = onFavoritesPage && hasRemoveButtons();
  const userId = readUserId(onPostListPage, onOwnFavoritesPage, favoritesPageId);
  const blacklistedTags = readTagBlacklist();
  return {
    version: SCRIPT_VERSION,
    onFavoritesPage,
    onPostListPage,
    onPostPage: url.includes("page=post&s=view"),
    onFirstFavoritesPage: onFavoritesPage && (readQueryParam("pid") === null || readQueryParam("pid") === "0"),
    usingFirefox: agent.toLowerCase().includes("firefox"),
    onMobileDevice,
    onDesktopDevice: !onMobileDevice,
    platform: onMobileDevice ? "mobile" : "desktop",
    userId,
    favoritesPageId,
    userIsOnTheirOwnFavoritesPage: onOwnFavoritesPage,
    blacklistedTags,
    negatedBlacklistedTags: negateTags(blacklistedTags),
    usingDarkMode: readCookie("theme") === "dark"
  };
}

function hasRemoveButtons(): boolean {
  return document.querySelector("a[onclick*=\"page=favorites&s=delete\"]") !== null;
}

function readUserId(onPostListPage: boolean, onOwnFavoritesPage: boolean, favoritesPageId: string | null): string {
  if (onPostListPage) {
    const href = document.querySelector("#my-favorites")?.getAttribute("href") ?? "";
    return new URLSearchParams(href.split("?")[1] ?? "").get("id") ?? "";
  }
  return onOwnFavoritesPage ? favoritesPageId ?? "" : "";
}

function readTagBlacklist(): string {
  let tags = readCookie("tag_blacklist");

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
