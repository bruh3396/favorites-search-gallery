export class PlainPress {
  private handled: boolean | undefined;
  private readonly onPlainClick: () => boolean;

  constructor(onPlainClick: () => boolean) {
    this.onPlainClick = onPlainClick;
  }

  public press(event: PointerEvent): void {
    this.handled = undefined;

    if (event.pointerType !== "mouse" || event.button !== 0 || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    this.handled = this.onPlainClick();

    if (this.handled) {
      event.preventDefault();
    }
  }

  public release(): boolean {
    const wasHandled = this.handled ?? this.onPlainClick();

    this.handled = undefined;
    return wasHandled;
  }
}
