import { getCookie } from "../utils/browser/cookie";
import { getQueryParam } from "../utils/browser/url";
import { negateTags } from "../utils/string/format";

declare const SCRIPT_VERSION: string;
export const VERSION = SCRIPT_VERSION;
export const ON_SEARCH_PAGE = location.href.includes("page=post&s=list");
export const ON_FAVORITES_PAGE = location.href.includes("page=favorites");
export const ON_POST_PAGE = location.href.includes("page=post&s=view");
export const USING_FIREFOX = navigator.userAgent.toLowerCase().includes("firefox");
export const ON_MOBILE_DEVICE = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
export const ON_DESKTOP_DEVICE = !ON_MOBILE_DEVICE;

export const USER_ID = getCookie("user_id", "");
export const FAVORITES_PAGE_ID = getQueryParam("id");
export const USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = USER_ID === FAVORITES_PAGE_ID;
export const ON_FIRST_FAVORITES_PAGE = ON_FAVORITES_PAGE && (getQueryParam("pid") === null || getQueryParam("pid") === "0");
export const BLACKLISTED_TAGS = getTagBlacklist();
export const NEGATED_BLACKLISTED_TAGS = negateTags(BLACKLISTED_TAGS);

function getTagBlacklist(): string {
  let tags = getCookie("tag_blacklist", "") ?? "";

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
