import { BASE_INDEX_URL } from "@/adapters/rule34/client/urls";

export function profilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}

export function parseFavoriteCount(html: string): number {
  const favoritesUrl = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"))
    .find(a => a.href.includes("page=favorites&s=view"));

  if (favoritesUrl === undefined || favoritesUrl.textContent === null) {
    return 0;
  }
  return parseInt(favoritesUrl.textContent, 10);
}
