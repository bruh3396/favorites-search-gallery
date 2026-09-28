import { PostMedia } from "@/core/domain/post/post";
import { MediaKind } from "@/core/domain/media/media";

export const isVideo = (item: PostMedia): boolean => isKind(item, "video");
export const isGif = (item: PostMedia): boolean => isKind(item, "gif");
export const isImage = (item: PostMedia): boolean => isKind(item, "image");

const isKind = (item: PostMedia, kind: MediaKind): boolean => item.media.kind === kind;
