import { postListPageIndex, postListPageOffset } from "@/adapters/rule34/client/post_list_page";
import { ColorScheme } from "@/core/boundary/environment";

export type Rule34PageName = "favorites" | "postList";

const TAG_BLACKLIST_ENCODINGS = 3;
const COOKIE_LIFETIME_SECONDS = 365 * 24 * 60 * 60;
const HEADER_SELECTOR = "#header";
const PAGINATOR_SELECTOR = "#paginator";
const NATIVE_CONTENT_SELECTOR = "#content, div:has(.thumb)";
const POST_LIST_SELECTOR = "#post-list";
const POST_LIST_NATIVE_CHILDREN_SELECTOR = ":scope > :not(.sidebar)";
const POST_LIST_CONTENT_CLASS = "content";
const UNUSED_SCRIPT = /(?:fluidplayer|awesomplete)/;
const UNUSED_GLOBALS = [
  "fluidPlayer", "webpackChunkfluid_player", "Awesomplete", "dashjs",
  "Post",
  "getCaptcha", "loadCaptchaScript",
  "captchaInstance", "captchaInstanceFormKey", "captchaSiteKey",
  "captchaProvider", "captchaScriptLoaded", "captchaRenderIdFn",
  "captchaResponseFormKey", "captchaCSSClass"
];

export class Rule34Document {
  private readonly postListPaginators = new Map<number, HTMLElement>();

  public readPageName(): Rule34PageName | null {
    const page = readQueryParam("page");

    if (page === "favorites") {
      return "favorites";
    }

    if (page === "post" && readQueryParam("s") === "list") {
      return "postList";
    }
    return null;
  }

  public readFavoritesPageId(): string {
    return readQueryParam("id") ?? "";
  }

  public isFirstFavoritesPage(): boolean {
    const pageOffset = readQueryParam("pid");
    return this.readPageName() === "favorites" && (pageOffset === null || pageOffset === "0");
  }

  public readSearchQuery(): string {
    return readQueryParam("tags") ?? "";
  }

  public readPostListPageIndex(): number {
    return postListPageIndex(readPageOffset());
  }

  public readUserId(): string {
    return readCookie("user_id");
  }

  public readTheme(): ColorScheme {
    return readCookie("theme") === "dark" ? "dark" : "light";
  }

  public readTagBlacklist(): string {
    let tags = readCookie("tag_blacklist");

    for (let i = 0; i < TAG_BLACKLIST_ENCODINGS; i += 1) {
      tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
    }
    return tags;
  }

  public setTheme(colorScheme: ColorScheme): void {
    document.cookie = `theme=${colorScheme}; max-age=${COOKIE_LIFETIME_SECONDS}; path=/`;
  }

  public setHeaderVisible(visible: boolean): void {
    const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);

    if (header !== null) {
      header.style.display = visible ? "" : "none";
    }
  }

  public setPaginatorVisible(visible: boolean): void {
    const paginator = document.querySelector<HTMLElement>(PAGINATOR_SELECTOR);

    if (paginator !== null) {
      paginator.style.display = visible ? "" : "none";
    }
  }

  public keepPaginator(pageIndex: number, paginator: HTMLElement | null): void {
    if (paginator !== null) {
      this.postListPaginators.set(pageIndex, paginator);
    }
  }

  public reflectPostListPage(pageIndex: number): void {
    const paginator = this.postListPaginators.get(pageIndex);

    if (paginator !== undefined) {
      replacePaginator(paginator);
    }
    setPageOffset(postListPageOffset(pageIndex));
  }

  public clearNativePage(): void {
    removeNativeContent();
    removeUnusedScripts();
    releaseUnusedGlobals();
  }

  public claimPostListContent(): HTMLElement | null {
    const postList = document.querySelector<HTMLElement>(POST_LIST_SELECTOR);

    if (postList === null) {
      return null;
    }
    const claimed = document.createElement("div");

    claimed.className = POST_LIST_CONTENT_CLASS;
    claimed.style.flex = "1";
    postList.querySelectorAll(POST_LIST_NATIVE_CHILDREN_SELECTOR).forEach(purgeNativeContent);
    postList.append(claimed);
    return claimed;
  }
}

function readQueryParam(name: string): string | null {
  return new URL(location.href).searchParams.get(name);
}

function readPageOffset(): number {
  const offset = Number(readQueryParam("pid"));
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}

function readCookie(key: string): string {
  const prefix = `${key}=`;
  const cookie = document.cookie.split(";").map(entry => entry.trimStart()).find(entry => entry.startsWith(prefix));
  return cookie === undefined ? "" : cookie.substring(prefix.length);
}

function setPageOffset(offset: number): void {
  const url = new URL(location.href);

  url.searchParams.set("pid", String(offset));
  history.replaceState(null, "", url);
}

function replacePaginator(paginator: HTMLElement): void {
  const current = document.querySelector<HTMLElement>(PAGINATOR_SELECTOR);

  if (current === null || current === paginator) {
    return;
  }
  paginator.style.display = current.style.display;
  current.replaceWith(paginator);
}

function removeNativeContent(): void {
  const content = document.querySelector<HTMLElement>(NATIVE_CONTENT_SELECTOR);

  if (content !== null) {
    purgeNativeContent(content);
  }
}

function purgeNativeContent(content: Element): void {
  for (const element of content.querySelectorAll("*")) {
    stripAttributes(element);
    element.remove();
  }
  stripAttributes(content);
  content.remove();
}

function stripAttributes(element: Element): void {
  for (const name of [...element.getAttributeNames()]) {
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
