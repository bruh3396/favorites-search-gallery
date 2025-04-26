import {getCookie} from "../../store/cookies/cookie";

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
