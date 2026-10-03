import { ORIGIN, WIMG_ORIGIN } from "@/adapters/rule34/client/hosts";
import { Rule34FileExtension } from "@/adapters/rule34/client/media/extension";
import { readLocator } from "@/adapters/rule34/client/media/locator";

export function previewUrl(locator: string): string {
  const { directory, name } = readLocator(locator);
  return `${WIMG_ORIGIN}/thumbnails//${directory}/thumbnail_${name}.jpg`;
}

export function fileUrl(locator: string, extension: Rule34FileExtension): string {
  const { directory, name } = readLocator(locator);
  return `${ORIGIN}/images//${directory}/${name}.${extension}`;
}
