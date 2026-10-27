import { isRule34CdnFileExtension, rule34CdnFileExtensionKind } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";
import { Media } from "@/core/domain/media/media";
import { MediaKind } from "@/core/domain/media/media_kind";

const FILE_URL = /\/(thumbnails|samples|images)\/+([^/]+)\/+(?:thumbnail_|sample_)?([^/.?]+)(?:\.([a-z0-9]+))?/i;
const VIDEO_TAGS = ["video", "mp4"];
const GIF_TAGS = ["gif", "animated", "animated_gif"];

export function mintRule34CdnMedia({ url, tags }: { url: string; tags: string }): Media | null {
  const match = FILE_URL.exec(url);

  if (match === null) {
    return null;
  }
  const [, folder, directory, name, rawExtension = ""] = match;
  const extension = rawExtension.toLowerCase();

  if (folder === "images" && isRule34CdnFileExtension(extension)) {
    return { kind: rule34CdnFileExtensionKind(extension), locator: `${directory}/${name}.${extension}` };
  }
  return { kind: guessKind(tags), locator: `${directory}/${name}` };
}

function guessKind(tags: string): MediaKind {
  const tagList = tags.split(" ");

  if (VIDEO_TAGS.some(tag => tagList.includes(tag))) {
    return "video";
  }
  return GIF_TAGS.some(tag => tagList.includes(tag)) ? "gif" : "image";
}
