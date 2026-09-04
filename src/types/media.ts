import { Searchable } from "@/types/search";

export type Resolution = "3840x2160" | "7680x4320" | "1920x1080";
export type ImageExtension = "jpg" | "png" | "jpeg";
export type AnimatedExtension = "gif" | "mp4";
export type MediaExtension = ImageExtension | AnimatedExtension;

export type MediaType = "image" | "video" | "gif";
export type VideoTag = "video" | "mp4";
export type GifTag = "gif" | "animated" | "animated_gif";
export type MediaTypeTag = VideoTag | GifTag;

export type MediaExtensionMapping = {
  id: string;
  extension: ImageExtension;
};

export interface MediaItem extends Searchable {
  readonly id: string;
  readonly thumbUrl: string;
  readonly extension?: MediaExtension;
}
