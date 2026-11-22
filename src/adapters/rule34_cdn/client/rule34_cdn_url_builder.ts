import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";
import { readRule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";

const ORIGIN = "https://rule34.xxx";
const WIMG_ORIGIN = "https://wimg.rule34.xxx";
const VIDEO_ORIGIN = "https://ahrimp4.rule34.xxx";

export function buildRule34CdnPreviewUrl(locator: string): string {
  const { directory, stem } = readRule34CdnLocator(locator);
  return `${WIMG_ORIGIN}/thumbnails//${directory}/thumbnail_${stem}.jpg`;
}

export function buildRule34CdnFileUrl(locator: string, rule34CdnFileExtension: Rule34CdnFileExtension): string {
  const { directory, stem } = readRule34CdnLocator(locator);
  const origin = rule34CdnFileExtension === "mp4" ? VIDEO_ORIGIN : ORIGIN;
  return `${origin}/images//${directory}/${stem}.${rule34CdnFileExtension}`;
}

export function buildRule34CdnWimgUrl(url: string): string {
  const moved = new URL(url);

  moved.host = new URL(WIMG_ORIGIN).host;
  return moved.href;
}
