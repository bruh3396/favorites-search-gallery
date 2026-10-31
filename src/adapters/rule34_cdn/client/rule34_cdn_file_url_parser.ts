import { Rule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";
import { isRule34CdnFileExtension } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";

const RULE34_CDN_FILE_URL_PATTERN = /\/(thumbnails|samples|images)\/+([^/]+)\/+(?:thumbnail_|sample_)?([^/.?]+)(?:\.([a-z0-9]+))?/i;

export function parseRule34CdnFileUrl(url: string): Rule34CdnLocator | null {
  const match = RULE34_CDN_FILE_URL_PATTERN.exec(url);

  if (match === null) {
    return null;
  }
  const [, folder, directory, stem, rawExtension = ""] = match;
  const extension = rawExtension.toLowerCase();
  return { directory, stem, extension: folder === "images" && isRule34CdnFileExtension(extension) ? extension : null };
}
