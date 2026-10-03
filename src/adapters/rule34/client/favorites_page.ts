import { BASE_INDEX_URL } from "@/adapters/rule34/client/urls";
import { Post } from "@/core/domain/post/post";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { parseThumb } from "@/adapters/rule34/client/thumb";

export const FAVORITES_PER_PAGE = 50;

export function favoritesPageUrl(pageId: string, offset: number): string {
  return `${BASE_INDEX_URL}favorites&s=view&id=${pageId}&pid=${offset}`;
}

export function favoritesPageOffset(pageIndex: number): number {
  return pageIndex * FAVORITES_PER_PAGE;
}

export function parseFavoritesPage(page: ParentNode, mintMedia: Rule34MintMedia): Post[] {
  return extractFavoriteElements(page).map(thumb => parseThumb(thumb, mintMedia));
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
