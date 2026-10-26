import { describe, expect, test } from "vitest";
import { listenForHotkeys } from "@/core/ui/hotkeys/hotkey_listener";

type Command = "first" | "second";

function setup(): { ran: Command[]; press: (init: KeyboardEventInit, target?: EventTarget) => KeyboardEvent; stop: () => void } {
  const ran: Command[] = [];
  const stop = listenForHotkeys<Command>(document, { a: "first", b: "second" }, {
    first: () => ran.push("first"),
    second: () => ran.push("second")
  });
  const press = (init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, composed: true, ...init });

    target.dispatchEvent(event);
    return event;
  };
  return { ran, press, stop };
}

describe("listenForHotkeys", () => {
  test("runs the command bound to the key and claims the press", () => {
    const { ran, press, stop } = setup();

    expect(press({ key: "b" }).defaultPrevented).toBe(true);
    expect(ran).toEqual(["second"]);
    stop();
  });

  test("leaves unbound keys alone", () => {
    const { ran, press, stop } = setup();

    expect(press({ key: "x" }).defaultPrevented).toBe(false);
    expect(ran).toEqual([]);
    stop();
  });

  test("ignores modified, repeated and already claimed presses", () => {
    const { ran, press, stop } = setup();

    press({ key: "a", ctrlKey: true });
    press({ key: "a", metaKey: true });
    press({ key: "a", altKey: true });
    press({ key: "a", repeat: true });
    document.body.addEventListener("keydown", event => event.preventDefault(), { once: true });
    press({ key: "a" });
    expect(ran).toEqual([]);
    stop();
  });

  test("ignores presses while typing, even inside a shadow root", () => {
    const { ran, press, stop } = setup();
    const host = document.createElement("div");
    const input = document.createElement("input");

    host.attachShadow({ mode: "open" }).append(input);
    document.body.append(host);
    press({ key: "a" }, input);
    host.remove();
    expect(ran).toEqual([]);
    stop();
  });

  test("ignores presses from inside an open dialog", () => {
    const { ran, press, stop } = setup();
    const dialog = document.createElement("dialog");

    document.body.append(dialog);
    dialog.open = true;
    press({ key: "a" }, dialog);
    dialog.remove();
    expect(ran).toEqual([]);
    stop();
  });

  test("stops listening once stopped", () => {
    const { ran, press, stop } = setup();

    stop();
    press({ key: "a" });
    expect(ran).toEqual([]);
  });
});
