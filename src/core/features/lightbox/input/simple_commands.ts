import { LightboxCommand, LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { Readable } from "@/core/utils/reactive/signal";

const SIMPLE_COMMANDS: ReadonlySet<LightboxCommand> = new Set<LightboxCommand>(["showNext", "showPrevious", "togglePause", "dismiss", "close", "openPostPage", "openOriginal"]);

export function limitToSimpleCommands(handlers: LightboxCommandHandlers, simple: Readable<boolean>): LightboxCommandHandlers {
  const entries = Object.entries(handlers) as Array<[LightboxCommand, () => void]>;
  return Object.fromEntries(entries.map(([command, run]) => [
command, (): void => {
    if (!simple.peek() || SIMPLE_COMMANDS.has(command)) {
      run();
    }
  }
])) as LightboxCommandHandlers;
}
