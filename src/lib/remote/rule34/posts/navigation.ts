import { buildPostListUrlFromQuery, buildPostPageUrl } from "@/lib/remote/url";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { toMediaItem } from "@/lib/thumb/media_item";

export function openPost(id: string): void {
  window.open(buildPostPageUrl(id), "_blank");
}

export function openPostList(searchQuery: string): void {
  window.open(buildPostListUrlFromQuery(searchQuery));
}

export async function openMedia(thumb: HTMLElement): Promise<void> {
  window.open(await resolveMediaUrl(toMediaItem(thumb)), "_blank");
}
