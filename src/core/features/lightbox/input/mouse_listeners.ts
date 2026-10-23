import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";

const MIDDLE_BUTTON = 1;

export type LightboxMouseCommandHandlers = Pick<LightboxCommandHandlers, "openPostPage" | "close">;

export interface LightboxMouseListeners {
  onWheel(event: WheelEvent): void;
  onMousedown(event: MouseEvent): void;
  onAuxclick(event: MouseEvent): void;
  onContextmenu(event: MouseEvent): void;
}

export function createLightboxMouseListeners(handlers: LightboxMouseCommandHandlers): LightboxMouseListeners {
  return {
    onWheel: (event): void => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    },
    onMousedown: (event): void => {
      if (event.button === MIDDLE_BUTTON) {
        event.preventDefault();
      }
    },
    onAuxclick: (event): void => {
      if (event.button === MIDDLE_BUTTON) {
        event.preventDefault();
        handlers.openPostPage();
      }
    },
    onContextmenu: (event): void => {
      if (!event.shiftKey) {
        event.preventDefault();
        handlers.close();
      }
    }
  };
}
