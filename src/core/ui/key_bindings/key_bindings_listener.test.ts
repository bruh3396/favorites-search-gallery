import { describe, expect, test } from "vitest";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { Signal } from "@/core/utils/reactive/signal";
import { listenForKeyBindings } from "@/core/ui/key_bindings/key_bindings_listener";

type Command = "first" | "second";

function setup(target: EventTarget = document): {
  ranCommands: Command[];
  keyBindings: Signal<KeyBindings<Command>>;
  press: (init: KeyboardEventInit, origin?: EventTarget) => KeyboardEvent;
  stop: () => void;
} {
  const ranCommands: Command[] = [];
  const keyBindings = new Signal<KeyBindings<Command>>({ first: ["a"], second: ["b"] });
  const stop = listenForKeyBindings<Command>(
    { keyBindings, repeatableCommands: new Set(["second"]) },
    {
      target,
      handlers: {
        first: () => ranCommands.push("first"),
        second: () => ranCommands.push("second")
      }
    }
  );
  const press = (init: KeyboardEventInit, origin: EventTarget = document.body): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, composed: true, ...init });

    origin.dispatchEvent(event);
    return event;
  };
  return { ranCommands, keyBindings, press, stop };
}

describe("listenForKeyBindings", () => {
  test("runs the command bound to the key and claims the press", () => {
    const { ranCommands, press, stop } = setup();

    expect(press({ key: "b" }).defaultPrevented).toBe(true);
    expect(ranCommands).toEqual(["second"]);
    stop();
  });

  test("leaves unbound keys alone", () => {
    const { ranCommands, press, stop } = setup();

    expect(press({ key: "x" }).defaultPrevented).toBe(false);
    expect(ranCommands).toEqual([]);
    stop();
  });

  test("follows changed key bindings", () => {
    const { ranCommands, keyBindings, press, stop } = setup();

    keyBindings.value = { first: ["x"], second: [] };
    press({ key: "a" });
    press({ key: "b" });
    press({ key: "x" });
    expect(ranCommands).toEqual(["first"]);
    stop();
  });

  test("runs a held key again only for repeatable commands, but still claims the press", () => {
    const { ranCommands, press, stop } = setup();

    expect(press({ key: "a", repeat: true }).defaultPrevented).toBe(true);
    press({ key: "b", repeat: true });
    expect(ranCommands).toEqual(["second"]);
    stop();
  });

  test("ignores modified and already claimed presses", () => {
    const { ranCommands, press, stop } = setup();

    press({ key: "a", ctrlKey: true });
    press({ key: "a", metaKey: true });
    press({ key: "a", altKey: true });
    document.body.addEventListener("keydown", event => event.preventDefault(), { once: true });
    press({ key: "a" });
    expect(ranCommands).toEqual([]);
    stop();
  });

  test("ignores presses while typing, even inside a shadow root", () => {
    const { ranCommands, press, stop } = setup();
    const host = document.createElement("div");
    const input = document.createElement("input");

    host.attachShadow({ mode: "open" }).append(input);
    document.body.append(host);
    press({ key: "a" }, input);
    host.remove();
    expect(ranCommands).toEqual([]);
    stop();
  });

  test.each([["Enter"], [" "]])("leaves %j to a focused button or link, but not to other elements", key => {
    const { ranCommands, keyBindings, press, stop } = setup();
    const button = document.createElement("button");
    const link = Object.assign(document.createElement("a"), { href: "#" });
    const plain = document.createElement("div");

    keyBindings.value = { first: [key] };
    document.body.append(button, link, plain);
    const pressedOnButton = press({ key }, button);

    press({ key }, link);
    press({ key }, plain);
    button.remove();
    link.remove();
    plain.remove();
    expect([pressedOnButton.defaultPrevented, ranCommands]).toEqual([false, ["first"]]);
    stop();
  });

  test("ignores presses from inside an open dialog below it", () => {
    const { ranCommands, press, stop } = setup();
    const dialog = document.createElement("dialog");

    document.body.append(dialog);
    dialog.open = true;
    press({ key: "a" }, dialog);
    dialog.remove();
    expect(ranCommands).toEqual([]);
    stop();
  });

  test("handles presses inside the open dialog it listens on", () => {
    const dialog = document.createElement("dialog");

    document.body.append(dialog);
    dialog.open = true;
    const { ranCommands, press, stop } = setup(dialog);

    press({ key: "a" }, dialog);
    expect(ranCommands).toEqual(["first"]);
    stop();
    dialog.remove();
  });

  test("focuses the element it listens on", () => {
    const element = document.createElement("div");

    element.tabIndex = -1;
    document.body.append(element);
    const { press, stop } = setup(element);

    press({ key: "a" }, element);
    expect(document.activeElement).toBe(element);
    stop();
    element.remove();
  });

  test("stops listening once stopped", () => {
    const { ranCommands, press, stop } = setup();

    stop();
    press({ key: "a" });
    expect(ranCommands).toEqual([]);
  });
});
