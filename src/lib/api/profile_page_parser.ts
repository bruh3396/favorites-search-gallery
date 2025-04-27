const PARSER = new DOMParser();

export function extractFavoritesCount(html: string): number {
  const favoritesURL = Array.from(PARSER.parseFromString(html, "text/html").querySelectorAll("a"))
    .find(a => a.href.includes("page=favorites&s=view"));

  if (favoritesURL === undefined || favoritesURL.textContent === null) {
    return 0;
  }
  return parseInt(favoritesURL.textContent);
}
