import { EXTENSION_REGEX } from "../../environment/constants";
import { THUMBNAIL_ORIGIN } from "./origin";

const IMAGE_SOURCE_NORMALIZATION_REGEX = /^([^.]*\/\/)?(?:[^.]+\.)*rule34/;
const THUMB_SOURCE_COMPRESSION_REGEX = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;
const SAMPLE_REGEX = /\/([^/]+)$/;

export function normalizeImageSource(source: string): string {
  return source.replace(IMAGE_SOURCE_NORMALIZATION_REGEX, "$1rule34");
}

export function decompressPreviewSource(compressedSource: string): string {
  const splitSource = compressedSource.split("_");
  return `${THUMBNAIL_ORIGIN}/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  const match = source.match(THUMB_SOURCE_COMPRESSION_REGEX);
  return match === null ? "" : match.splice(1).join("_");
}

export function convertPreviewURLToImageURL(thumbUrl: string): string {
  return normalizeImageSource(thumbUrl)
    .replace("thumbnails", "images")
    .replace("thumbnail_", "")
    .replace("us.rule34", "rule34");
}

export function convertImageURLToSampleURL(imageUrl: string): string {
  return imageUrl.replace("images", "samples").replace(SAMPLE_REGEX, "/sample_$1").replace(EXTENSION_REGEX, ".jpg");
}

export function removeIdFromImageURL(imageUrl: string): string {
  return imageUrl.replace(/\?\d+/, "");
}
