export const LIGHTBOX_ICON_PATHS = {
  play: "M8 5.5v13l10-6.5z",
  pause: "M6.5 5.5h4v13h-4zM13.5 5.5h4v13h-4z",
  close: "M6 6l12 12M18 6L6 18",
  heart: "M12 20s-7.5-4.6-9.6-9.3C.9 7.2 3.1 3.5 6.8 3.5c2.1 0 3.5 1.1 4.2 2.2h2c.7-1.1 2.1-2.2 4.2-2.2 3.7 0 5.9 3.7 4.4 7.2C19.5 15.4 12 20 12 20z",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  fullscreen: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  exitFullscreen: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  postPage: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
} as const;

export type LightboxIcon = keyof typeof LIGHTBOX_ICON_PATHS;
