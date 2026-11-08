import { KeyBindings, findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { Readable } from "@/core/utils/reactive/signal";

export interface KeyBindingsListenerConfiguration<Command extends string> {
  readonly keyBindings: Readable<KeyBindings<Command>>;
  readonly repeatableCommands: ReadonlySet<Command>;
}

export interface KeyBindingsListenerDependencies<Command extends string> {
  target: EventTarget;
  handlers: CommandHandlers<Command>;
}

const PRESSABLE_SELECTOR = "a[href], button, summary, [role=button], [role=tab], [role=option], [role=menuitem], [role=radio], [role=checkbox], [role=switch]";

export function listenForKeyBindings<Command extends string>(
  { keyBindings, repeatableCommands }: KeyBindingsListenerConfiguration<Command>,
  { target, handlers }: KeyBindingsListenerDependencies<Command>
): () => void {
  const listener = (event: Event): void => {
    if (
      !(event instanceof KeyboardEvent) || isModified(event) || event.defaultPrevented || isTyping(event) || isPressingControl(event) ||
      isFromInnerDialog(event)
    ) {
      return;
    }
    const command = findCommandInKeyBindings(keyBindings.peek(), event.key);

    if (command === undefined) {
      return;
    }
    event.preventDefault();

    if (event.repeat && !repeatableCommands.has(command)) {
      return;
    }

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.focus({ preventScroll: true });
    }
    handlers[command]();
  };

  target.addEventListener("keydown", listener);
  return () => target.removeEventListener("keydown", listener);
}

function isModified(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

function isTyping(event: Event): boolean {
  const origin = event.composedPath()[0];
  return origin instanceof HTMLElement && (origin.isContentEditable || origin.matches("input, textarea, select"));
}

function isPressingControl(event: KeyboardEvent): boolean {
  const origin = event.composedPath()[0];
  return (event.key === "Enter" || event.key === " ") && origin instanceof HTMLElement && origin.matches(PRESSABLE_SELECTOR);
}

function isFromInnerDialog(event: Event): boolean {
  const eventTargets = event.composedPath();
  const innerEventTargets = event.currentTarget === null ? [] : eventTargets.slice(0, Math.max(eventTargets.indexOf(event.currentTarget), 0));
  return innerEventTargets.some(eventTarget => eventTarget instanceof HTMLDialogElement && eventTarget.open);
}
