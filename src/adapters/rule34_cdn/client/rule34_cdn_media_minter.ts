import { Media } from "@/core/domain/media/media";
import { MediaKind } from "@/core/domain/media/media_kind";
import { Rule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";
import { rule34CdnFileExtensionKind } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";

const VIDEO_TAGS = ["video", "mp4"];
const GIF_TAGS = ["gif", "animated", "animated_gif"];

export function mintRule34CdnMedia({ rule34CdnLocator, tags }: { rule34CdnLocator: Rule34CdnLocator; tags: string }): Media {
  const { directory, stem, extension } = rule34CdnLocator;

  if (extension !== null) {
    return { kind: rule34CdnFileExtensionKind(extension), locator: `${directory}/${stem}.${extension}` };
  }
  return { kind: guessKind(tags), locator: `${directory}/${stem}` };
}

function guessKind(tags: string): MediaKind {
  const tagList = tags.split(" ");

  if (VIDEO_TAGS.some(tag => tagList.includes(tag))) {
    return "video";
  }
  return GIF_TAGS.some(tag => tagList.includes(tag)) ? "gif" : "image";
}
