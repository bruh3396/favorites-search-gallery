import { negateTags } from "@/utils/pure/tag";
import { readCookie } from "@/utils/browser/cookie";
import { readQueryParam } from "@/utils/browser/window";

declare const SCRIPT_VERSION: string;
export const VERSION = SCRIPT_VERSION;
export const ON_POST_LIST_PAGE = location.href.includes("page=post&s=list");
export const ON_FAVORITES_PAGE = location.href.includes("page=favorites");
export const ON_POST_PAGE = location.href.includes("page=post&s=view");
export const USING_FIREFOX = navigator.userAgent.toLowerCase().includes("firefox");
export const ON_MOBILE_DEVICE = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
export const ON_DESKTOP_DEVICE = !ON_MOBILE_DEVICE;
export const PLATFORM = ON_MOBILE_DEVICE ? "mobile" : "desktop";

export const USER_ID = readCookie("user_id");
export const FAVORITES_PAGE_ID = readQueryParam("id");
export const USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = USER_ID === FAVORITES_PAGE_ID;
export const ON_FIRST_FAVORITES_PAGE = ON_FAVORITES_PAGE && (readQueryParam("pid") === null || readQueryParam("pid") === "0");
export const BLACKLISTED_TAGS = getTagBlacklist();
export const NEGATED_BLACKLISTED_TAGS = negateTags(BLACKLISTED_TAGS);

function getTagBlacklist(): string {
  let tags = readCookie("tag_blacklist");

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}
