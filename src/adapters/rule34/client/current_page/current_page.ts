import { Post } from "@/core/domain/post/post";
import { parseFavoritesPage } from "@/adapters/rule34/client/favorites_page/parser";

export type PageName = "favorites" | "postList";

const TAG_BLACKLIST_ENCODINGS = 3;

export function readPageName(): PageName | null {
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

export function readFirstFavoritesPage(): Post[] | null {
  return onFirstFavoritesPage() ? parseFavoritesPage(document) : null;
}

export function readUserId(): string {
  return readCookie("user_id");
}

export function readTheme(): string {
  return readCookie("theme");
}

export function readTagBlacklist(): string {
  let tags = readCookie("tag_blacklist");

  for (let i = 0; i < TAG_BLACKLIST_ENCODINGS; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
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
