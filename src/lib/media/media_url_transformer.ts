import { THUMBNAIL_ORIGIN } from "../rule34_constants";
import { extensionRegex } from "./media_constants";

const imageSourceNormalizationRegex = /^([^.]*\/\/)?(?:[^.]+\.)*rule34/;
const thumbSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;
const sampleRegex = /\/([^/]+)$/;

export function normalizeImageSource(source: string): string {
  return source.replace(imageSourceNormalizationRegex, "$1rule34");
}

export function decompressPreviewSource(compressedSource: string): string {
  const splitSource = compressedSource.split("_");
  return `${THUMBNAIL_ORIGIN}/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  const match = source.match(thumbSourceCompressionRegex);
  return match === null ? "" : match.splice(1).join("_");
}

export function convertPreviewUrlToImageUrl(thumbUrl: string): string {
  return normalizeImageSource(thumbUrl)
    .replace("thumbnails", "images")
    .replace("thumbnail_", "")
    .replace("us.rule34", "rule34");
}

export function convertImageUrlToSampleUrl(imageUrl: string): string {
  return imageUrl.replace("images", "samples").replace(sampleRegex, "/sample_$1").replace(extensionRegex, ".jpg");
}

export function removeIdFromImageUrl(imageUrl: string): string {
  return imageUrl.replace(/\?\d+/, "");
}

export function convertToWimgUrl(url: string): string {
  try {
    const parsed = new URL(url);

    parsed.hostname = parsed.hostname.replace(/^([^.]+\.)*rule34\.xxx$/, "wimg.rule34.xxx");
    return parsed.toString();
  } catch {
    return url;
  }
}
