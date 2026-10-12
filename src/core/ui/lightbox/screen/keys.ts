export interface LightboxKeysDependencies {
  dialog: HTMLDialogElement;
  onShowNext: () => void;
  onShowPrevious: () => void;
  onClose: () => void;
  onToggleAutoplay: () => void;
}

// Keys are heard on the document, so they still work when focus slips out of the dialog.
export class LightboxKeys {

  constructor(private readonly dependencies: LightboxKeysDependencies) { }

  public listen(): void {
    this.dependencies.dialog.ownerDocument.addEventListener("keydown", this.onKeydown);
  }

  public stop(): void {
    this.dependencies.dialog.ownerDocument.removeEventListener("keydown", this.onKeydown);
  }

  private readonly onKeydown = (event: KeyboardEvent): void => this.handleKey(event);

  private handleKey(event: KeyboardEvent): void {
    const { dialog, onShowNext, onShowPrevious, onClose, onToggleAutoplay } = this.dependencies;
    const action = {
      " ": onToggleAutoplay,
      ArrowRight: onShowNext,
      d: onShowNext,
      D: onShowNext,
      ArrowLeft: onShowPrevious,
      a: onShowPrevious,
      A: onShowPrevious,
      Backspace: onClose,
      Delete: onClose
    }[event.key];

    if (action !== undefined && !isTyping(event)) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      action();
    }
  }
}

function isTyping(event: KeyboardEvent): boolean {
  const [target] = event.composedPath();
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}
