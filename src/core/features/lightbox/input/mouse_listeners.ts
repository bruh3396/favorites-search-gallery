import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";

const MIDDLE_BUTTON = 1;
const RIGHT_BUTTON = 2;

export type LightboxMouseCommandHandlers = Pick<LightboxCommandHandlers, "openPostPage" | "close">;

export interface LightboxMouseListeners {
  onWheel(event: WheelEvent): void;
  onMousedown(event: MouseEvent): void;
  onAuxclick(event: MouseEvent): void;
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
      } else if (event.button === RIGHT_BUTTON) {
        if (event.view !== null) {
          swallowNextContextmenu(event.view);
        }
        handlers.close();
      }
    },
    onAuxclick: (event): void => {
      if (event.button === MIDDLE_BUTTON) {
        event.preventDefault();
        handlers.openPostPage();
      }
    }
  };
}

function swallowNextContextmenu(view: Window): void {
  const swallow = (event: Event): void => {
    event.preventDefault();
    disarm();
  };
  const disarm = (): void => {
    view.removeEventListener("contextmenu", swallow, true);
    view.removeEventListener("mousedown", disarm, true);
  };

  view.addEventListener("contextmenu", swallow, true);
  view.addEventListener("mousedown", disarm, true);
}
