export type LightboxCommand = "showNext" | "showPrevious" | "toggleAutoplay" | "togglePause" | "toggleMute" |
"toggleFullscreen" | "toggleZoom" | "toggleDetails" | "dismiss" | "download" | "openPostPage" | "openOriginal" | "close" | "addFavorite";

export const REPEATABLE_LIGHTBOX_COMMANDS: ReadonlySet<LightboxCommand> = new Set<LightboxCommand>(["showNext", "showPrevious"]);
