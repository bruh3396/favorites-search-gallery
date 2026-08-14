import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { imageUrlToSampleUrl, replaceExtension, withExtension } from "@/lib/media/url_transformer";
import { MediaItem } from "@/types/media";
import { imageUrl } from "@/lib/media/url";

export const resolveSampleUrl = async(item: MediaItem): Promise<string> => imageUrlToSampleUrl(await resolveImageUrl(item));
export const resolveImageUrl = async(item: MediaItem): Promise<string> => replaceExtension(await resolveMediaUrl(item), "mp4", "jpg");
export const resolveMediaUrl = async(item: MediaItem): Promise<string> => withExtension(imageUrl(item), await ExtensionResolver.resolveExtension(item));
