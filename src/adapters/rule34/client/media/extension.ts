import { MediaKind } from "@/core/domain/media/media";

export type ImageExtension = "jpg" | "png" | "jpeg";
export type FileExtension = ImageExtension | "gif" | "mp4";

const FILE_EXTENSIONS: readonly FileExtension[] = ["jpg", "png", "jpeg", "gif", "mp4"];
const EXTENSION_KINDS: Record<FileExtension, MediaKind> = { jpg: "image", png: "image", jpeg: "image", gif: "gif", mp4: "video" };

export function isFileExtension(extension: string): extension is FileExtension {
  return (FILE_EXTENSIONS as readonly string[]).includes(extension);
}

export function kindOf(extension: FileExtension): MediaKind {
  return EXTENSION_KINDS[extension];
}
