import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { Readable } from "@/core/utils/reactive/signal";

const SIMPLE_COMMANDS: ReadonlySet<LightboxCommand> = new Set<LightboxCommand>([
  "showNext",
  "showPrevious",
  "togglePause",
  "toggleMute",
  "toggleFullscreen",
  "dismiss",
  "close",
  "openPostPage",
  "openOriginal",
  "addFavorite"
]);

export function limitLightboxCommandHandlers(handlers: CommandHandlers<LightboxCommand>, simple: Readable<boolean>): CommandHandlers<LightboxCommand> {
  const entries = Object.entries(handlers) as Array<[LightboxCommand, () => void]>;
  return Object.fromEntries(entries.map(([lightboxCommand, run]) => [
    lightboxCommand, (): void => {
      if (!simple.peek() || SIMPLE_COMMANDS.has(lightboxCommand)) {
        run();
      }
    }
  ])) as CommandHandlers<LightboxCommand>;
}
