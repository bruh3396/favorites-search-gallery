import { MediaKind } from "@/core/domain/media/media";

export type Rule34CdnImageExtension = "jpg" | "png" | "jpeg";
export type Rule34CdnFileExtension = Rule34CdnImageExtension | "gif" | "mp4";

const FILE_EXTENSIONS: readonly Rule34CdnFileExtension[] = ["jpg", "png", "jpeg", "gif", "mp4"];
const EXTENSION_KINDS: Record<Rule34CdnFileExtension, MediaKind> = {
  jpg: "image",
  png: "image",
  jpeg: "image",
  gif: "gif",
  mp4: "video"
};

export function isFileExtension(extension: string): extension is Rule34CdnFileExtension {
  return (FILE_EXTENSIONS as readonly string[]).includes(extension);
}

export function kindOf(extension: Rule34CdnFileExtension): MediaKind {
  return EXTENSION_KINDS[extension];
}
