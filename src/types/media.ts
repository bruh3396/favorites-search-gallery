export type Resolution = "3840x2160" | "7680x4320" | "1920x1080";
export type ImageExtension = "jpg" | "png" | "jpeg";
export type AnimatedExtension = "gif" | "mp4";
export type MediaExtension = ImageExtension | AnimatedExtension;

export type MediaType = "image" | "video" | "gif";

export const enum EncodedMediaType {
  Image = 0,
  Video = 1,
  Gif = 2
}

export const enum EncodedMediaExtension {
  Jpg = 0,
  Jpeg = 1,
  Png = 2,
  Gif = 3,
  Mp4 = 4,
  Unknown = 5,
}

export type VideoTag = "video" | "mp4";
export type GifTag = "gif" | "animated" | "animated_gif";
export type MediaTypeTag = VideoTag | GifTag;

export type MediaExtensionMapping = {
  id: string;
  extension: ImageExtension;
};

export interface MediaItem {
  readonly id: string;
  readonly thumbUrl: string;
  readonly mediaType: MediaType;
  readonly extension?: MediaExtension;
}

export function encodeMediaExtension(extension: MediaExtension): EncodedMediaExtension {
  switch (extension) {
    case "jpg":
      return EncodedMediaExtension.Jpg;
    case "jpeg":
      return EncodedMediaExtension.Jpeg;
    case "png":
      return EncodedMediaExtension.Png;
    case "gif":
      return EncodedMediaExtension.Gif;
    case "mp4":
    default:
      return EncodedMediaExtension.Mp4;
  }
}

export function decodeMediaExtension(extension: EncodedMediaExtension): MediaExtension | undefined {
  switch (extension) {
    case EncodedMediaExtension.Jpg:
      return "jpg";
    case EncodedMediaExtension.Jpeg:
      return "jpeg";
    case EncodedMediaExtension.Png:
      return "png";
    case EncodedMediaExtension.Gif:
      return "gif";
    case EncodedMediaExtension.Mp4:
      return "mp4";
    default:
      return undefined;
  }
}
