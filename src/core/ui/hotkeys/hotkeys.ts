export type Keymap<C extends string> = Readonly<Record<string, C>>;

export type CommandHandlers<C extends string> = Readonly<Record<C, () => void>>;

export function listenForHotkeys<C extends string>(target: Document, keymap: Keymap<C>, handlers: CommandHandlers<C>): () => void {
  const listener = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.defaultPrevented || isTyping(event) || isInsideDialog(event)) {
      return;
    }
    const command = keymap[event.key];

    if (command !== undefined) {
      event.preventDefault();
      handlers[command]();
    }
  };

  target.addEventListener("keydown", listener);
  return () => target.removeEventListener("keydown", listener);
}

function isTyping(event: KeyboardEvent): boolean {
  const origin = event.composedPath()[0];
  return origin instanceof HTMLElement && (origin.isContentEditable || origin.matches("input, textarea, select"));
}

function isInsideDialog(event: KeyboardEvent): boolean {
  return event.composedPath().some(node => node instanceof HTMLDialogElement && node.open);
}
