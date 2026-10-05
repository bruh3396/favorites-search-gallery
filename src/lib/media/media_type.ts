import { MediaKind } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";

export const isVideo = (item: MediaItem): boolean => isKind(item, "video");
export const isGif = (item: MediaItem): boolean => isKind(item, "gif");
export const isImage = (item: MediaItem): boolean => isKind(item, "image");

const isKind = (item: MediaItem, kind: MediaKind): boolean => item.media.kind === kind;
