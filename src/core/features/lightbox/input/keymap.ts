import { LightboxCommandName, LightboxCommands } from "@/core/features/lightbox/commands/commands";

export type LightboxBindableCommandName = {
  [Name in LightboxCommandName]: [] extends Parameters<LightboxCommands[Name]> ? Name : never
}[LightboxCommandName];

export type LightboxKeymap = Readonly<Record<string, LightboxBindableCommandName>>;

export const DEFAULT_LIGHTBOX_KEYMAP: LightboxKeymap = {
  " ": "toggleAutoplay",
  ArrowRight: "showNext",
  d: "showNext",
  D: "showNext",
  ArrowLeft: "showPrevious",
  a: "showPrevious",
  A: "showPrevious",
  Backspace: "close",
  Delete: "close",
  z: "toggleZoom",
  Z: "toggleZoom"
};
