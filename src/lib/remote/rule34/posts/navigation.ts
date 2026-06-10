import { buildPostListUrlFromQuery, buildPostPageUrl } from "@/lib/remote/url/page_url_builder";
import { resolveMediaUrl } from "@/lib/media/url_resolver";

export function openPost(id: string): void {
  window.open(buildPostPageUrl(id), "_blank");
}

export function openPostList(searchQuery: string): void {
  window.open(buildPostListUrlFromQuery(searchQuery));
}

export async function openMedia(thumb: HTMLElement): Promise<void> {
  window.open(await resolveMediaUrl(thumb), "_blank");
}
