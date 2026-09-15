import { negateTags } from "@/utils/pure/tag";
import { readCookie } from "@/utils/browser/cookie";
import { readQueryParam } from "@/utils/browser/window";

declare const SCRIPT_VERSION: string;

export let VERSION = scriptVersion();
export let ON_POST_LIST_PAGE = href().includes("page=post&s=list");
export let ON_FAVORITES_PAGE = href().includes("page=favorites");
export let ON_POST_PAGE = href().includes("page=post&s=view");
export let USING_FIREFOX = userAgent().toLowerCase().includes("firefox");
export let ON_MOBILE_DEVICE = (/iPhone|iPad|iPod|Android/i).test(userAgent());
export let ON_DESKTOP_DEVICE = !ON_MOBILE_DEVICE;
export let PLATFORM: "mobile" | "desktop" = ON_MOBILE_DEVICE ? "mobile" : "desktop";

export let USER_ID = cookie("user_id");
export let FAVORITES_PAGE_ID = queryParam("id");
export let USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = USER_ID === FAVORITES_PAGE_ID;
export let ON_FIRST_FAVORITES_PAGE = ON_FAVORITES_PAGE && (queryParam("pid") === null || queryParam("pid") === "0");
export let BLACKLISTED_TAGS = getTagBlacklist();
export let NEGATED_BLACKLISTED_TAGS = negateTags(BLACKLISTED_TAGS);

export interface EnvironmentOverrides {
  VERSION: string;
  ON_POST_LIST_PAGE: boolean;
  ON_FAVORITES_PAGE: boolean;
  ON_POST_PAGE: boolean;
  USING_FIREFOX: boolean;
  ON_MOBILE_DEVICE: boolean;
  ON_DESKTOP_DEVICE: boolean;
  PLATFORM: "mobile" | "desktop";
  USER_ID: string;
  FAVORITES_PAGE_ID: string | null;
  USER_IS_ON_THEIR_OWN_FAVORITES_PAGE: boolean;
  ON_FIRST_FAVORITES_PAGE: boolean;
  BLACKLISTED_TAGS: string;
  NEGATED_BLACKLISTED_TAGS: string;
}

export function setEnvironment(overrides: Partial<EnvironmentOverrides>): void {
  if ("VERSION" in overrides) {
    VERSION = overrides.VERSION as string;
  }

  if ("ON_POST_LIST_PAGE" in overrides) {
    ON_POST_LIST_PAGE = overrides.ON_POST_LIST_PAGE as boolean;
  }

  if ("ON_FAVORITES_PAGE" in overrides) {
    ON_FAVORITES_PAGE = overrides.ON_FAVORITES_PAGE as boolean;
  }

  if ("ON_POST_PAGE" in overrides) {
    ON_POST_PAGE = overrides.ON_POST_PAGE as boolean;
  }

  if ("USING_FIREFOX" in overrides) {
    USING_FIREFOX = overrides.USING_FIREFOX as boolean;
  }

  if ("ON_MOBILE_DEVICE" in overrides) {
    ON_MOBILE_DEVICE = overrides.ON_MOBILE_DEVICE as boolean;
  }

  if ("ON_DESKTOP_DEVICE" in overrides) {
    ON_DESKTOP_DEVICE = overrides.ON_DESKTOP_DEVICE as boolean;
  }

  if ("PLATFORM" in overrides) {
    PLATFORM = overrides.PLATFORM as "mobile" | "desktop";
  }

  if ("USER_ID" in overrides) {
    USER_ID = overrides.USER_ID as string;
  }

  if ("FAVORITES_PAGE_ID" in overrides) {
    FAVORITES_PAGE_ID = overrides.FAVORITES_PAGE_ID as string | null;
  }

  if ("USER_IS_ON_THEIR_OWN_FAVORITES_PAGE" in overrides) {
    USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = overrides.USER_IS_ON_THEIR_OWN_FAVORITES_PAGE as boolean;
  }

  if ("ON_FIRST_FAVORITES_PAGE" in overrides) {
    ON_FIRST_FAVORITES_PAGE = overrides.ON_FIRST_FAVORITES_PAGE as boolean;
  }

  if ("BLACKLISTED_TAGS" in overrides) {
    BLACKLISTED_TAGS = overrides.BLACKLISTED_TAGS as string;
  }

  if ("NEGATED_BLACKLISTED_TAGS" in overrides) {
    NEGATED_BLACKLISTED_TAGS = overrides.NEGATED_BLACKLISTED_TAGS as string;
  }
}

export function resetEnvironment(): void {
  VERSION = scriptVersion();
  ON_POST_LIST_PAGE = href().includes("page=post&s=list");
  ON_FAVORITES_PAGE = href().includes("page=favorites");
  ON_POST_PAGE = href().includes("page=post&s=view");
  USING_FIREFOX = userAgent().toLowerCase().includes("firefox");
  ON_MOBILE_DEVICE = (/iPhone|iPad|iPod|Android/i).test(userAgent());
  ON_DESKTOP_DEVICE = !ON_MOBILE_DEVICE;
  PLATFORM = ON_MOBILE_DEVICE ? "mobile" : "desktop";
  USER_ID = cookie("user_id");
  FAVORITES_PAGE_ID = queryParam("id");
  USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = USER_ID === FAVORITES_PAGE_ID;
  ON_FIRST_FAVORITES_PAGE = ON_FAVORITES_PAGE && (queryParam("pid") === null || queryParam("pid") === "0");
  BLACKLISTED_TAGS = getTagBlacklist();
  NEGATED_BLACKLISTED_TAGS = negateTags(BLACKLISTED_TAGS);
}

function getTagBlacklist(): string {
  let tags = cookie("tag_blacklist");

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}

function scriptVersion(): string {
  return typeof SCRIPT_VERSION === "undefined" ? "" : SCRIPT_VERSION;
}

function href(): string {
  return typeof location === "undefined" ? "" : location.href;
}

function userAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

function cookie(key: string): string {
  return typeof document === "undefined" ? "" : readCookie(key);
}

function queryParam(key: string): string | null {
  return typeof window === "undefined" ? null : readQueryParam(key);
}
