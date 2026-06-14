import { DEFAULT_EXTENSION, extensionRegex } from "@/lib/media/constants";
import { MediaExtension } from "@/types/media";
import { withHostname } from "@/utils/string/url";

export const withRule34Hostname = (url: string): string => withHostname(url, "rule34.xxx");
export const withRule34WimgHostname = (url: string): string => withHostname(url, "wimg.rule34.xxx");
export const withExtension = (url: string, extension: MediaExtension): string => url.replace(extensionRegex, prependDot(extension));
export const replaceExtension = (url: string, oldExt: MediaExtension, newExt: MediaExtension): string => url.replace(createExtensionRegex(oldExt), prependDot(newExt));
export const thumbUrlToImageUrl = (url: string): string => toImageUrl(withRule34Hostname(url));
export const imageUrlToSampleUrl = (url: string): string => toSampleUrl(withExtension(url, DEFAULT_EXTENSION));

const toImageUrl = (url: string) :string => url.replace("thumbnails", "images").replace("thumbnail_", "");
const toSampleUrl = (url: string) :string => url.replace("images", "samples").replace(/\/([^/]+)$/, "/sample_$1");
const prependDot = (extension: MediaExtension): string => `.${extension}`;
const createExtensionRegex = (extension: MediaExtension): RegExp => new RegExp(`\\.${extension}$`);
