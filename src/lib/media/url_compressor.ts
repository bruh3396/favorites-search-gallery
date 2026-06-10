import { THUMBNAIL_ORIGIN } from "@/lib/rule34_constants";

const thumbSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;

export function decompressPreviewSource(compressedSource: string): string {
  const splitSource = compressedSource.split("_");
  return `${THUMBNAIL_ORIGIN}/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  const match = source.match(thumbSourceCompressionRegex);
  return match === null ? "" : match.splice(1).join("_");
}
