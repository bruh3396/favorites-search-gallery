import { buildPostPageUrl, buildSearchPageUrlFromQuery } from "./remote/url/page_url_builder";
import { resolveMediaUrl } from "./media/media_url_resolver";

export function openPost(id: string): void {
  window.open(buildPostPageUrl(id), "_blank");
}

export function openSearchPage(searchQuery: string): void {
  window.open(buildSearchPageUrlFromQuery(searchQuery));
}

export async function openMedia(thumb: HTMLElement): Promise<void> {
  window.open(await resolveMediaUrl(thumb), "_blank");
}

export function createObjectUrlFromSvg(svg: string): string {
  const blob = new Blob([svg], {
    type: "image/svg+xml"
  });
  return URL.createObjectURL(blob);
}
