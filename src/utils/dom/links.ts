import * as FSG_URL from "../../lib/api/url";
import { getOriginalContentURL } from "../../lib/api/media_api";

export function openPostPage(id: string): void {
  window.open(FSG_URL.createPostPageURL(id), "_blank");
}

export function openSearchPage(searchQuery: string): void {
  window.open(FSG_URL.createSearchPageURL(searchQuery));
}

export async function openOriginal(thumb: HTMLElement): Promise<void> {
  window.open(await getOriginalContentURL(thumb), "_blank");
}

export function createObjectURLFromSvg(svg: string): string {
  const blob = new Blob([svg], {
    type: "image/svg+xml"
  });
  return URL.createObjectURL(blob);
}
