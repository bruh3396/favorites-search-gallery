export function parseRule34ProfileFavoriteCount(html: string): number {
  const favoritesUrl = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("a")]
    .find(a => a.href.includes("page=favorites&s=view"));

  if (favoritesUrl === undefined || favoritesUrl.textContent === null) {
    return 0;
  }
  return parseInt(favoritesUrl.textContent, 10);
}
