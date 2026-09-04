import { GifTag, ImageExtension, MediaExtension, VideoTag } from "@/types/media";

export const DEFAULT_EXTENSION: MediaExtension = "jpg";
export const extensionRegex = (/\.(png|jpg|jpeg|gif|mp4)/);
export const allImageExtensions: readonly ImageExtension[] = ["jpeg", "png", "jpg"];
export const allMediaExtensions: readonly MediaExtension[] = ["jpeg", "png", "jpg", "gif", "mp4"];
export const videoTags: ReadonlySet<VideoTag> = new Set(["video", "mp4"]);
export const gifTags: ReadonlySet<GifTag> = new Set(["gif", "animated", "animated_gif"]);
