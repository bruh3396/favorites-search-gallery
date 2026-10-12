export const MEDIA_KINDS = ["image", "video", "gif"] as const;

export type MediaKind = typeof MEDIA_KINDS[number];

export interface Media {
  readonly kind: MediaKind;
  readonly locator: string;
}

export const NO_MEDIA: Media = { kind: "image", locator: "" };

export function hasMedia(media: Media): boolean {
  return media.locator !== "";
}
