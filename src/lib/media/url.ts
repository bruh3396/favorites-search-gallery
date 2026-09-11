import { DEFAULT_EXTENSION, extensionRegex } from "@/lib/media/constants";
import { HOSTNAME, WIMG_HOSTNAME } from "@/lib/constants";
import { MediaExtension, MediaItem } from "@/types/media";
import { withHostname, withNoQueryParams } from "@/utils/pure/url";

export const imageUrl = (item: MediaItem): string => withNoQueryParams(thumbUrlToImageUrl(item.thumbUrl));
export const videoUrl = (item: MediaItem): string => withExtension(imageUrl(item), "mp4");
export const gifUrl = (item: MediaItem): string => withExtension(imageUrl(item), item.extension === "png" ? "png" : "gif");

export const withRule34Hostname = (url: string): string => withHostname(url, HOSTNAME);
export const withRule34WimgHostname = (url: string): string => withHostname(url, WIMG_HOSTNAME);

export const withExtension = (url: string, extension: MediaExtension): string => url.replace(extensionRegex, `.${extension}`);
export const replaceExtension = (url: string, oldExtension: MediaExtension, newExtension: MediaExtension): string => url.replace(new RegExp(`\\.${oldExtension}(?=$|\\?)`), `.${newExtension}`);

export const thumbUrlToImageUrl = (url: string): string => withRule34Hostname(url).replace("thumbnails", "images").replace("thumbnail_", "");
export const imageUrlToSampleUrl = (url: string): string => withExtension(url, DEFAULT_EXTENSION).replace("images", "samples").replace(/\/([^/]+)$/, "/sample_$1");
