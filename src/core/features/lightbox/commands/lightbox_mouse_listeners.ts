import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";

const MIDDLE_BUTTON = 1;
const RIGHT_BUTTON = 2;

type LightboxMouseCommandHandlers = Pick<CommandHandlers<LightboxCommand>, "openPostPage" | "close">;

export interface LightboxMouseListeners {
  onWheel(event: WheelEvent): void;
  onMousedown(event: MouseEvent): void;
  onAuxclick(event: MouseEvent): void;
}

export function createLightboxMouseListeners(lightboxMouseCommandHandlers: LightboxMouseCommandHandlers): LightboxMouseListeners {
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
        lightboxMouseCommandHandlers.close();
      }
    },
    onAuxclick: (event): void => {
      if (event.button === MIDDLE_BUTTON) {
        event.preventDefault();
        lightboxMouseCommandHandlers.openPostPage();
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
