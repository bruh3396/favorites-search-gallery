import { imageUrlToSampleUrl, replaceExtension, withExtension } from "@/lib/media/url_transformer";
import { MediaItem } from "@/types/media";
import { imageUrl } from "@/lib/thumb/url";
import { resolveExtension } from "@/lib/media/extension_resolver";

export const resolveSampleUrl = async(item: MediaItem): Promise<string> => imageUrlToSampleUrl(await resolveImageUrl(item));
export const resolveImageUrl = async(item: MediaItem): Promise<string> => replaceExtension(await resolveMediaUrl(item), "mp4", "jpg");
export const resolveMediaUrl = async(item: MediaItem): Promise<string> => withExtension(imageUrl(item), await resolveExtension(item));
