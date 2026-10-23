import { LightboxCommand, LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";

export type LightboxKeymap = Readonly<Record<string, LightboxCommand>>;

export function createLightboxKeyListener(keymap: LightboxKeymap, handlers: LightboxCommandHandlers): (event: KeyboardEvent) => void {
  return event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const command = keymap[event.key];

    if (command !== undefined) {
      event.preventDefault();

      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.focus({ preventScroll: true });
      }
      handlers[command]();
    }
  };
}
