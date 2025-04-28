import {FavoriteItem} from "../../types/favorite/favorite";

const PARSER = new DOMParser();

function extractFavoriteElements(favoritesPageHTML: string): HTMLElement[] {
  const dom = PARSER.parseFromString(favoritesPageHTML, "text/html");
  const thumbs = Array.from(dom.querySelectorAll(".thumb"));

  if (thumbs.length > 0) {
    return thumbs.filter(thumb => thumb instanceof HTMLElement);
  }
  return Array.from(dom.querySelectorAll("img"))
    .filter(image => image.src.includes("thumbnail_"))
    .map(image => image.parentElement)
    .filter(thumb => thumb !== null);
}

export function extractFavorites(favoritesPageHTML: string): FavoriteItem[] {
  return extractFavoriteElements(favoritesPageHTML).map(element => new FavoriteItem(element));
}
