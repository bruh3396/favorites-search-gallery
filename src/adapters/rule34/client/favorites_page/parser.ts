import { Post } from "@/core/domain/post/post";
import { parseThumb } from "@/adapters/rule34/client/thumb/parser";

export function parseFavoritesPage(page: ParentNode): Post[] {
  return extractFavoriteElements(page).map(parseThumb);
}

function extractFavoriteElements(page: ParentNode): HTMLElement[] {
  const thumbs = Array.from(page.querySelectorAll<HTMLElement>(".thumb"));
  return thumbs.length > 0 ? thumbs : extractThumbImageElements(page);
}

function extractThumbImageElements(page: ParentNode): HTMLElement[] {
  return Array.from(page.querySelectorAll("img"))
    .filter(image => image.src.includes("thumbnail_"))
    .map(image => image.parentElement)
    .filter(thumb => thumb !== null);
}
