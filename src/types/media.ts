export type AnimatedExtension = "gif" | "mp4"
export type ImageExtension = "jpg" | "png" | "jpeg"
export type MediaExtension = ImageExtension | AnimatedExtension
export type MediaType = "image" | "video" | "gif"
export type MediaExtensionMapping = {
  id: string
  extension: ImageExtension
}
export type Resolution = "3840x2160" | "7680x4320" | "1920x1080"
