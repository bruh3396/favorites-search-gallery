import { THUMB_ORIGIN } from "@/lib/constants";
import { copyString } from "@/utils/pure/string";

const previewSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;

export function decompressPreviewSource(compressedSource: string): string {
  const splitSource = compressedSource.split("_").map(copyString);
  return `${THUMB_ORIGIN}/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  const match = source.match(previewSourceCompressionRegex);
  return match === null ? "" : match.splice(1).join("_");
}
