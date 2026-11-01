import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

export function createLightboxKeyListener(keymap: Keymap<LightboxCommand>, handlers: CommandHandlers<LightboxCommand>): (event: KeyboardEvent) => void {
  return event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const lightboxCommand = keymap[event.key];

    if (lightboxCommand !== undefined) {
      event.preventDefault();

      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.focus({ preventScroll: true });
      }
      handlers[lightboxCommand]();
    }
  };
}
