export interface LightboxKeysDependencies {
  dialog: HTMLDialogElement;
  showNext: () => void;
  showPrevious: () => void;
  close: () => void;
  toggleAutoplay: () => void;
}

// Keys are heard on the document, so they still work when focus slips out of the dialog.
export class LightboxKeys {

  constructor(private readonly dependencies: LightboxKeysDependencies) { }

  public start(): void {
    this.dependencies.dialog.ownerDocument.addEventListener("keydown", this.onKeydown);
  }

  public stop(): void {
    this.dependencies.dialog.ownerDocument.removeEventListener("keydown", this.onKeydown);
  }

  private readonly onKeydown = (event: KeyboardEvent): void => this.handleKey(event);

  private handleKey(event: KeyboardEvent): void {
    const { dialog, showNext, showPrevious, close, toggleAutoplay } = this.dependencies;
    const action = {
      " ": toggleAutoplay,
      ArrowRight: showNext,
      d: showNext,
      D: showNext,
      ArrowLeft: showPrevious,
      a: showPrevious,
      A: showPrevious,
      Backspace: close,
      Delete: close
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
