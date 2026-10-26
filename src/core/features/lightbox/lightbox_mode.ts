export const LIGHTBOX_MODES = ["off", "simple", "full"] as const;

export type LightboxMode = (typeof LIGHTBOX_MODES)[number];
