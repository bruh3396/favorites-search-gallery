import { getCookie } from "../../utils/browser/cookie";
import { negateTags } from "../../utils/string/format";

export const USER_ID = getCookie("user_id", "");
export const FAVORITES_PAGE_ID = getFavoritesPageId();
export const USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = USER_ID === FAVORITES_PAGE_ID;
export const BLACKLISTED_TAGS = getTagBlacklist();
export const NEGATED_BLACKLISTED_TAGS = negateTags(BLACKLISTED_TAGS);

function getFavoritesPageId(): string | null {
  const match = (/(?:&|\?)id=(\d+)/).exec(window.location.href);
  return match ? match[1] : null;
}

function getTagBlacklist(): string {
  let tags = getCookie("tag_blacklist", "") ?? "";

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
