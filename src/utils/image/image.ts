const IMAGE_SOURCE_CLEANUP_REGEX = /^([^.]*\/\/)?(?:[^.]+\.)*rule34/;
const THUMB_SOURCE_COMPRESSION_REGEX = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;

export function cleanImageSource(source: string): string {
  return source.replace(IMAGE_SOURCE_CLEANUP_REGEX, "$1rule34");
}

export function decompressThumbSource(compressedSource: string): string {
  const splitSource = compressedSource.split("_");
  return `https://us.rule34.xxx/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressThumbSource(source: string): string {
  const match = source.match(THUMB_SOURCE_COMPRESSION_REGEX);
  return match === null ? "" : match.splice(1).join("_");
}
