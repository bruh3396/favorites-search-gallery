import { MediaKind } from "@/core/domain/media/media";

export type Rule34ImageExtension = "jpg" | "png" | "jpeg";
export type Rule34FileExtension = Rule34ImageExtension | "gif" | "mp4";

const FILE_EXTENSIONS: readonly Rule34FileExtension[] = ["jpg", "png", "jpeg", "gif", "mp4"];
const EXTENSION_KINDS: Record<Rule34FileExtension, MediaKind> = {
  jpg: "image",
  png: "image",
  jpeg: "image",
  gif: "gif",
  mp4: "video"
};

export function isFileExtension(extension: string): extension is Rule34FileExtension {
  return (FILE_EXTENSIONS as readonly string[]).includes(extension);
}

export function kindOf(extension: Rule34FileExtension): MediaKind {
  return EXTENSION_KINDS[extension];
}
