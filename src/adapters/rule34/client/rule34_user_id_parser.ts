const PROFILE_LINK_SELECTOR = "#user-index a[href*=\"page=account&s=profile&id=\"]";
const USER_ID = /^[0-9]+$/;

export function parseRule34UserId(html: string): string {
  const profileLink = new DOMParser().parseFromString(html, "text/html").querySelector(PROFILE_LINK_SELECTOR);
  const userId = new URLSearchParams(profileLink?.getAttribute("href")?.split("?")[1] ?? "").get("id") ?? "";
  return USER_ID.test(userId) ? userId : "";
}
