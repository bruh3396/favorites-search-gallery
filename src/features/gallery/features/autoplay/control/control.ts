import { AutoplayAction, AutoplayConfiguration, AutoplayDuration, AutoplayIntents } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayConfig } from "@/config/autoplay_config";
import { AutoplayShell } from "@/features/gallery/features/autoplay/shell/shell";

export interface AutoplayControlDependencies {
  shell: AutoplayShell;
  intents: AutoplayIntents;
}

export class AutoplayControl {
  private readonly intents: AutoplayIntents;
  private readonly dispatch: Record<AutoplayAction, () => void>;

  constructor({ platform }: AutoplayConfiguration, { shell, intents }: AutoplayControlDependencies) {
    this.intents = intents;
    this.dispatch = {
      toggleSettings: (): void => intents.toggleSettings(),
      togglePause: (): void => intents.togglePause(),
      toggleDirection: (): void => intents.toggleDirection()
    };
    shell.buttons.addEventListener(AutoplayConfig.menuActivationEvent[platform], (event) => this.onActivate(event));
    shell.settingsMenu.addEventListener("change", (event) => this.onChange(event));

    for (const [type, wasHeld] of AutoplayConfig.menuHoldEvents[platform]) {
      shell.menu.addEventListener(type, () => intents.holdMenu(wasHeld));
    }
  }

  private onActivate(event: Event): void {
    const target = (event.target as Element).closest<HTMLElement>("[data-autoplay-action]");

    if (target !== null) {
      this.dispatch[target.dataset.autoplayAction as AutoplayAction]();
    }
  }

  private onChange(event: Event): void {
    const field = event.target as HTMLInputElement | HTMLSelectElement;
    const kind = field.dataset.autoplayDuration as AutoplayDuration | undefined;

    if (kind !== undefined) {
      this.intents.changeDuration(kind, field.value);
    }
  }
}
