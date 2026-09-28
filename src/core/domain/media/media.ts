export type MediaKind = "image" | "video" | "gif";

export interface Media {
  readonly kind: MediaKind;
  readonly locator: string;
}
