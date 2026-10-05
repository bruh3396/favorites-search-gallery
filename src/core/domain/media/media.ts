export const MEDIA_KINDS = ["image", "video", "gif"] as const;

export type MediaKind = typeof MEDIA_KINDS[number];

export interface Media {
  readonly kind: MediaKind;
  readonly locator: string;
}
