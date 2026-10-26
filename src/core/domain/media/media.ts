import { MediaKind } from "@/core/domain/media/media_kind";

export interface Media {
  readonly kind: MediaKind;
  readonly locator: string;
}

export const NO_MEDIA: Media = { kind: "image", locator: "" };

export function hasMedia(media: Media): boolean {
  return media.locator !== "";
}
