import { getCookie } from "../../lib/global/cookie";

export function getUserId(): string {
  return getCookie("user_id", "");
}

export function getFavoritesPageId(): string | null {
  const match = (/(?:&|\?)id=(\d+)/).exec(window.location.href);
  return match ? match[1] : null;
}

export function isUserIsOnTheirOwnFavoritesPage(): boolean {
  return getUserId() === getFavoritesPageId();
}

export function getTagBlacklist(): string {
  let tags = getCookie("tag_blacklist", "") ?? "";

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
