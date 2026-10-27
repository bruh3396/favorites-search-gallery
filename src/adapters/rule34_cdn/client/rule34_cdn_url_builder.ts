import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";
import { readRule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";

const ORIGIN = "https://rule34.xxx";
const WIMG_ORIGIN = "https://wimg.rule34.xxx";

export function buildRule34CdnPreviewUrl(locator: string): string {
  const { directory, name } = readRule34CdnLocator(locator);
  return `${WIMG_ORIGIN}/thumbnails//${directory}/thumbnail_${name}.jpg`;
}

export function buildRule34CdnFileUrl(locator: string, extension: Rule34CdnFileExtension): string {
  const { directory, name } = readRule34CdnLocator(locator);
  return `${ORIGIN}/images//${directory}/${name}.${extension}`;
}

export function buildRule34CdnWimgUrl(url: string): string {
  const moved = new URL(url);

  moved.host = new URL(WIMG_ORIGIN).host;
  return moved.href;
}
