export type LightboxCommand = "showNext" | "showPrevious" | "togglePause" | "toggleMute" | "toggleFullscreen" | "download" | "openPostPage" | "close";

export type LightboxCommands = Readonly<Record<LightboxCommand, () => void>>;
