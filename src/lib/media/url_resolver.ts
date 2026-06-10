import { imageUrlToSampleUrl, replaceExtension, withExtension } from "@/lib/media/url_transformer";
import { Favorite } from "@/types/favorite";
import { imageUrl } from "@/lib/thumb/url";
import { resolveExtension } from "@/lib/media/extension_resolver";

// FIXME: temp alias so the downloader depends on a media-resolvable thing, not the
// favorites domain type. Still the legacy HTMLElement|Favorite union. Collapse into a
// real MediaItem capability type in the lib/media remodel — see docs/media-item-remodel.md.
export type MediaResolvable = HTMLElement | Favorite;

export async function resolveSampleUrl(item: HTMLElement | Favorite): Promise<string> {
  return imageUrlToSampleUrl(await resolveImageUrl(item));
}

export async function resolveImageUrl(item: HTMLElement | Favorite): Promise<string> {
  return replaceExtension(await resolveMediaUrl(item), "mp4", "jpg");
}

export async function resolveMediaUrl(item: HTMLElement | Favorite): Promise<string> {
  return withExtension(imageUrl(item), await resolveExtension(item));
}
