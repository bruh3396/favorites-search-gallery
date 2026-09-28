import { FileExtension, isFileExtension, kindOf } from "@/adapters/rule34/client/media/extension";
import { Media, MediaKind } from "@/core/domain/media/media";

export interface Rule34Locator {
  readonly directory: string;
  readonly name: string;
  readonly extension: FileExtension | null;
}

const FILE_URL = /\/(thumbnails|samples|images)\/+([^/]+)\/+(?:thumbnail_|sample_)?([^/.?]+)(?:\.([a-z0-9]+))?/i;
const VIDEO_TAGS = ["video", "mp4"];
const GIF_TAGS = ["gif", "animated", "animated_gif"];

export function mintMedia(url: string, tags: string): Media | null {
  const match = FILE_URL.exec(url);

  if (match === null) {
    return null;
  }
  const [, folder, directory, name, rawExtension = ""] = match;
  const extension = rawExtension.toLowerCase();

  if (folder === "images" && isFileExtension(extension)) {
    return { kind: kindOf(extension), locator: `${directory}/${name}.${extension}` };
  }
  return { kind: guessKind(tags), locator: `${directory}/${name}` };
}

export function readLocator(locator: string): Rule34Locator {
  const [directory = "", file = ""] = locator.split("/");
  const [name = "", extension = ""] = file.split(".");
  return { directory, name, extension: isFileExtension(extension) ? extension : null };
}

function guessKind(tags: string): MediaKind {
  const tagList = tags.split(" ");

  if (VIDEO_TAGS.some(tag => tagList.includes(tag))) {
    return "video";
  }
  return GIF_TAGS.some(tag => tagList.includes(tag)) ? "gif" : "image";
}
