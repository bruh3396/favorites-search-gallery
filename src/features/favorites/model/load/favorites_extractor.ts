import { FavoriteItem } from "../../types/favorite/favorite_item";

const PARSER = new DOMParser();

function extractThumbElements(dom: Document): HTMLElement[] {
  return Array.from(dom.querySelectorAll(".thumb")) as HTMLElement[];
}

function extractThumbImageElements(dom: Document): HTMLElement[] {
  return Array.from(dom.querySelectorAll("img"))
    .filter(image => image.src.includes("thumbnail_"))
    .map(image => image.parentElement)
    .filter(thumb => thumb !== null);
}

function extractFavoriteElements(favoritesPageHTML: string): HTMLElement[] {
  const dom = PARSER.parseFromString(favoritesPageHTML, "text/html");
  const thumbs = extractThumbElements(dom);
  return thumbs.length > 0 ? thumbs : extractThumbImageElements(dom);
}

export function extractFavorites(favoritesPageHTML: string): FavoriteItem[] {
  return extractFavoriteElements(favoritesPageHTML).map(element => new FavoriteItem(element));
}
