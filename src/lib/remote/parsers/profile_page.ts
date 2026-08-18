export function extractFavoritesCount(html: string): number {
  const favoritesUrl = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"))
    .find(a => a.href.includes("page=favorites&s=view"));

  if (favoritesUrl === undefined || favoritesUrl.textContent === null) {
    return 0;
  }
  return parseInt(favoritesUrl.textContent, 10);
}
