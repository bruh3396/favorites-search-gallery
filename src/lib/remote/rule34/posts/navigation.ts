import { buildPostListUrlFromQuery, buildPostPageUrl } from "../../url";
import { resolveMediaUrl } from "@/lib/media/url_resolver";
import { toMediaItem } from "@/lib/thumb/item";

export function openPost(id: string): void {
  window.open(buildPostPageUrl(id), "_blank");
}

export function openPostList(searchQuery: string): void {
  window.open(buildPostListUrlFromQuery(searchQuery));
}

export async function openMedia(thumb: HTMLElement): Promise<void> {
  window.open(await resolveMediaUrl(toMediaItem(thumb)), "_blank");
}
