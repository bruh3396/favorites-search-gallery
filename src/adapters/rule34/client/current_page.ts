import { ColorScheme } from "@/core/boundary/environment";
import { Post } from "@/core/domain/post/post";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { parseFavoritesPage } from "@/adapters/rule34/client/favorites_page";

export type Rule34PageName = "favorites" | "postList";

const TAG_BLACKLIST_ENCODINGS = 3;
const COOKIE_LIFETIME_SECONDS = 365 * 24 * 60 * 60;
const HEADER_SELECTOR = "#header";
const PAGINATOR_SELECTOR = "#paginator";
const NATIVE_CONTENT_SELECTOR = "#content, div:has(.thumb)";
const UNUSED_SCRIPT = /(?:fluidplayer|awesomplete)/;
const UNUSED_GLOBALS = [
  "fluidPlayer", "webpackChunkfluid_player", "Awesomplete", "dashjs",
  "Post",
  "getCaptcha", "loadCaptchaScript",
  "captchaInstance", "captchaInstanceFormKey", "captchaSiteKey",
  "captchaProvider", "captchaScriptLoaded", "captchaRenderIdFn",
  "captchaResponseFormKey", "captchaCSSClass"
];

export function readPageName(): Rule34PageName | null {
  const page = readQueryParam("page");

  if (page === "favorites") {
    return "favorites";
  }

  if (page === "post" && readQueryParam("s") === "list") {
    return "postList";
  }
  return null;
}

export function readFavoritesPageId(): string {
  return readQueryParam("id") ?? "";
}

export function readFirstFavoritesPage(mintMedia: Rule34MintMedia): Post[] | null {
  return onFirstFavoritesPage() ? parseFavoritesPage(document, mintMedia) : null;
}

export function readSearchQuery(): string {
  return readQueryParam("tags") ?? "";
}

export function readPageOffset(): number {
  const offset = Number(readQueryParam("pid"));
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}

export function readUserId(): string {
  return readCookie("user_id");
}

export function readTheme(): ColorScheme {
  return readCookie("theme") === "dark" ? "dark" : "light";
}

export function readTagBlacklist(): string {
  let tags = readCookie("tag_blacklist");

  for (let i = 0; i < TAG_BLACKLIST_ENCODINGS; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}

export function setTheme(colorScheme: ColorScheme): void {
  document.cookie = `theme=${colorScheme}; max-age=${COOKIE_LIFETIME_SECONDS}; path=/`;
}

export function setHeaderVisible(visible: boolean): void {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);

  if (header !== null) {
    header.style.display = visible ? "" : "none";
  }
}

export function setPageOffset(offset: number): void {
  const url = new URL(location.href);

  url.searchParams.set("pid", String(offset));
  history.replaceState(null, "", url);
}

export function replacePaginator(paginator: HTMLElement): void {
  const current = document.querySelector<HTMLElement>(PAGINATOR_SELECTOR);

  if (current === null || current === paginator) {
    return;
  }
  paginator.style.display = current.style.display;
  current.replaceWith(paginator);
}

export function setPaginatorVisible(visible: boolean): void {
  const paginator = document.querySelector<HTMLElement>(PAGINATOR_SELECTOR);

  if (paginator !== null) {
    paginator.style.display = visible ? "" : "none";
  }
}

export function clearNativePage(): void {
  removeNativeContent();
  removeUnusedScripts();
  releaseUnusedGlobals();
}

function onFirstFavoritesPage(): boolean {
  const pageOffset = readQueryParam("pid");
  return readPageName() === "favorites" && (pageOffset === null || pageOffset === "0");
}

function readQueryParam(name: string): string | null {
  return new URL(location.href).searchParams.get(name);
}

function readCookie(key: string): string {
  const prefix = `${key}=`;
  const cookie = document.cookie.split(";").map(entry => entry.trimStart()).find(entry => entry.startsWith(prefix));
  return cookie === undefined ? "" : cookie.substring(prefix.length);
}

function removeNativeContent(): void {
  const content = document.querySelector<HTMLElement>(NATIVE_CONTENT_SELECTOR);

  if (content !== null) {
    purgeNativeContent(content);
  }
}

function purgeNativeContent(content: HTMLElement): void {
  for (const element of content.querySelectorAll("*")) {
    stripAttributes(element);
    element.remove();
  }
  stripAttributes(content);
  content.remove();
}

function stripAttributes(element: Element): void {
  for (const name of Array.from(element.getAttributeNames())) {
    element.removeAttribute(name);
  }
}

function removeUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if (UNUSED_SCRIPT.test(script.src)) {
      script.remove();
    }
  }
}

function releaseUnusedGlobals(): void {
  for (const global of UNUSED_GLOBALS) {
    try {
      delete (window as unknown as Record<string, unknown>)[global];
    } catch (error) {
      console.error(error);
    }
  }
}
