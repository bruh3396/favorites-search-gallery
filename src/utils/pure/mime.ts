const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm"
};

export function extensionOfMimeType(type: string): string {
  return EXTENSIONS[type.split(";")[0].trim().toLowerCase()] ?? "bin";
}
