export type AnimatedExtension = "gif" | "mp4"
export type ImageExtension = "jpg" | "png" | "jpeg"
export type MediaExtension = ImageExtension | AnimatedExtension
export type MediaType = "image" | "video" | "gif"
export type MediaExtensionMapping = {
  id: string
  extension: ImageExtension
}
