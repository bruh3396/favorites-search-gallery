import { Post } from "@/core/domain/post/post";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { parseRule34Thumb } from "@/adapters/rule34/client/rule34_thumb_parser";

export function parseRule34FavoritesPage(page: ParentNode, mintMedia: MediaMinter): Post[] {
  return extractFavoriteElements(page).map(thumb => parseRule34Thumb(thumb, mintMedia)).filter(post => post !== null);
}

function extractFavoriteElements(page: ParentNode): HTMLElement[] {
  const thumbs = [...page.querySelectorAll<HTMLElement>(".thumb")];
  return thumbs.length > 0 ? thumbs : extractThumbImageElements(page);
}

function extractThumbImageElements(page: ParentNode): HTMLElement[] {
  return [...page.querySelectorAll("img")]
    .filter(image => image.src.includes("thumbnail_"))
    .map(image => image.parentElement)
    .filter(thumb => thumb !== null);
}
