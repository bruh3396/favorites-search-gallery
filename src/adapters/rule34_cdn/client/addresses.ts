import { ORIGIN, WIMG_ORIGIN } from "@/adapters/rule34_cdn/client/hosts";
import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/extension";
import { readLocator } from "@/adapters/rule34_cdn/client/locator";

export function previewUrl(locator: string): string {
  const { directory, name } = readLocator(locator);
  return `${WIMG_ORIGIN}/thumbnails//${directory}/thumbnail_${name}.jpg`;
}

export function fileUrl(locator: string, extension: Rule34CdnFileExtension): string {
  const { directory, name } = readLocator(locator);
  return `${ORIGIN}/images//${directory}/${name}.${extension}`;
}
