import { domParser } from "../../../utils/dom/dom_parser";

export function extractFavoritesCount(html: string): number {
  const favoritesUrl = Array.from(domParser.parseFromString(html, "text/html").querySelectorAll("a"))
    .find(a => a.href.includes("page=favorites&s=view"));

  if (favoritesUrl === undefined || favoritesUrl.textContent === null) {
    return 0;
  }
  return parseInt(favoritesUrl.textContent);
}
