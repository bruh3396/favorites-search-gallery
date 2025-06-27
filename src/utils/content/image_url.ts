const IMAGE_SOURCE_CLEANUP_REGEX = /^([^.]*\/\/)?(?:[^.]+\.)*rule34/;
const THUMB_SOURCE_COMPRESSION_REGEX = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;
const SAMPLE_REGEX = /\/([^/]+)$/;

export const EXTENSION_REGEX = (/\.(png|jpg|jpeg|gif|mp4)/);

export function cleanImageSource(source: string): string {
  return source.replace(IMAGE_SOURCE_CLEANUP_REGEX, "$1rule34");
}

export function decompressPreviewSource(compressedSource: string): string {
  const splitSource = compressedSource.split("_");
  return `https://us.rule34.xxx/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg`;
}

export function compressPreviewSource(source: string): string {
  const match = source.match(THUMB_SOURCE_COMPRESSION_REGEX);
  return match === null ? "" : match.splice(1).join("_");
}

export function convertPreviewURLToImageURL(thumbURL: string): string {
  return cleanImageSource(thumbURL).replace("thumbnails", "images").replace("thumbnail_", "").replace("us.rule34", "rule34");
}

export function convertImageURLToSampleURL(imageURL: string): string {
  return imageURL.replace("images", "samples").replace(SAMPLE_REGEX, "/sample_$1").replace(EXTENSION_REGEX, ".jpg");
}
