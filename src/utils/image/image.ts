const IMAGE_SOURCE_CLEANUP_REGEX = /^([^.]*\/\/)?(?:[^.]+\.)*rule34/;

export function cleanImageSource(source: string): string {
  return source.replace(IMAGE_SOURCE_CLEANUP_REGEX, "$1rule34");
}
