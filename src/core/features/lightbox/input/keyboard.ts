import { LightboxBindableCommandName, LightboxKeymap } from "@/core/features/lightbox/input/keymap";
import { LightboxCommands } from "@/core/features/lightbox/commands/commands";
import { Readable } from "@/core/utils/reactive/signal";
import { ZoomPoint } from "@/core/features/lightbox/zoom/zoom";

export interface LightboxKeyboardDependencies {
  dialog: HTMLDialogElement;
  commands: Pick<LightboxCommands, LightboxBindableCommandName>;
  keymap: Readable<LightboxKeymap>;
  lastPoint: Readable<ZoomPoint | undefined>;
}

export class LightboxKeyboard {
  constructor(private readonly dependencies: LightboxKeyboardDependencies) { }

  public start(): void {
    this.dependencies.dialog.ownerDocument.addEventListener("keydown", this.onKeydown);
  }

  public stop(): void {
    this.dependencies.dialog.ownerDocument.removeEventListener("keydown", this.onKeydown);
  }

  private readonly onKeydown = (event: KeyboardEvent): void => this.handleKey(event);

  private handleKey(event: KeyboardEvent): void {
    const { dialog, keymap } = this.dependencies;
    const name = Object.hasOwn(keymap.peek(), event.key) ? keymap.peek()[event.key] : undefined;

    if (name !== undefined && !hasShortcutModifier(event) && !isTyping(event)) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      this.run(name);
    }
  }

  private run(name: LightboxBindableCommandName): void {
    const { commands, lastPoint } = this.dependencies;

    if (name === "toggleZoom") {
      commands.toggleZoom(lastPoint.peek());
    } else {
      commands[name]();
    }
  }
}

function hasShortcutModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

function isTyping(event: KeyboardEvent): boolean {
  const [target] = event.composedPath();
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}
