import { buildPostPageURL, buildSearchPageURL } from "../../lib/server/url/page_url_builder";
import { resolveContentURL } from "../../lib/server/url/media_url_resolver";

export function openPostPage(id: string): void {
  window.open(buildPostPageURL(id), "_blank");
}

export function openSearchPage(searchQuery: string): void {
  window.open(buildSearchPageURL(searchQuery));
}

export async function openOriginal(thumb: HTMLElement): Promise<void> {
  window.open(await resolveContentURL(thumb), "_blank");
}

export function createObjectURLFromSvg(svg: string): string {
  const blob = new Blob([svg], {
    type: "image/svg+xml"
  });
  return URL.createObjectURL(blob);
}
