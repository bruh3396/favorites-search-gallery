export type LightboxCommand = "showNext" | "showPrevious" | "toggleAutoplay" | "togglePause" | "toggleMute" |
"toggleFullscreen" | "toggleZoom" | "toggleDetails" | "dismiss" | "download" | "openPostPage" | "openOriginal" | "close";

export type LightboxCommandHandlers = Readonly<Record<LightboxCommand, () => void>>;
