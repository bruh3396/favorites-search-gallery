import { WIMG_ORIGIN } from "@/lib/constants";
import { copyString } from "@/utils/pure/string";
import { isUrl } from "@/utils/pure/url";

const previewSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;

export function decompressPreviewSource(compressedSource: string): string {
  if (isUrl(compressedSource)) {
    return compressedSource;
  }
  const splitSource = compressedSource.split("_").map(copyString);
  return `${WIMG_ORIGIN}/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  if (!isUrl(source)) {
    return source;
  }
  const match = source.match(previewSourceCompressionRegex);
  return match === null ? "" : match.splice(1).join("_");
}
