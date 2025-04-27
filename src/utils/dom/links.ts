import {FSG_URL} from "../../lib/api/url";

export function openPostPage(id: string): void {
  window.open(FSG_URL.createPostPageURL(id), "_blank");
}

export function openSearchPage(searchQuery: string): void {
  window.open(FSG_URL.createSearchPageURL(searchQuery));
}

export function createObjectURLFromSvg(svg: string): string {
  const blob = new Blob([svg], {
    type: "image/svg+xml"
  });
  return URL.createObjectURL(blob);
}
