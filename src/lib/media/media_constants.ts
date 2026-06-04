import { GifTag, ImageExtension, MediaExtension, VideoTag } from "@/types/media";

export const DEFAULT_EXTENSION: MediaExtension = "jpg";
export const extensionRegex = (/\.(png|jpg|jpeg|gif|mp4)$/);
export const allImageExtensions: ImageExtension[] = ["jpeg", "png", "jpg"];
export const videoTags: Set<VideoTag> = new Set(["video", "mp4"]);
export const gifTags: Set<GifTag> = new Set(["gif", "animated", "animated_gif"]);
