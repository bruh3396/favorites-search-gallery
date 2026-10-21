import { LightboxBindableCommandName, LightboxKeymap } from "@/core/features/lightbox/input/keymap";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxKeyboard } from "@/core/features/lightbox/input/keyboard";
import { Signal } from "@/core/utils/reactive/signal";
import { ZoomPoint } from "@/core/features/lightbox/zoom/zoom";

const KEYMAP: LightboxKeymap = { ArrowRight: "showNext", Backspace: "close", z: "toggleZoom" };

type FakeCommands = Record<LightboxBindableCommandName, Mock<(point?: ZoomPoint) => void>>;

interface Setup {
  dialog: HTMLDialogElement;
  keyboard: LightboxKeyboard;
  commands: FakeCommands;
  keymap: Signal<LightboxKeymap>;
  lastPoint: Signal<ZoomPoint | undefined>;
}

function createFakeCommands(): FakeCommands {
  const names: LightboxBindableCommandName[] = ["showNext", "showPrevious", "close", "toggleAutoplay", "toggleZoom", "zoomOut", "toggleFullscreen", "download", "openOriginal", "openPostPage"];
  return Object.fromEntries(names.map(name => [name, vi.fn()])) as FakeCommands;
}

function setup(): Setup {
  const dialog = document.createElement("dialog");
  const commands = createFakeCommands();
  const keymap = new Signal<LightboxKeymap>(KEYMAP);
  const lastPoint = new Signal<ZoomPoint | undefined>(undefined);
  const keyboard = new LightboxKeyboard({ dialog, commands, keymap, lastPoint });

  document.body.append(dialog);
  keyboard.start();
  onTestFinished(() => {
    keyboard.stop();
    dialog.remove();
  });
  return { dialog, keyboard, commands, keymap, lastPoint };
}

function pressKey(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });

  target.dispatchEvent(event);
  return event;
}

describe("LightboxKeyboard", () => {
  test("runs the command its keymap binds to the key", () => {
    const { dialog, commands } = setup();

    pressKey(dialog, "ArrowRight");
    pressKey(dialog, "Backspace");
    expect([commands.showNext.mock.calls.length, commands.close.mock.calls.length]).toEqual([1, 1]);
  });

  test("follows a keymap that changes", () => {
    const { dialog, commands, keymap } = setup();

    keymap.value = { ArrowRight: "showPrevious" };
    pressKey(dialog, "ArrowRight");
    expect([commands.showNext.mock.calls.length, commands.showPrevious.mock.calls.length]).toEqual([0, 1]);
  });

  test("zooms at the pointer's last place, or at the center before the pointer has moved", () => {
    const { dialog, commands, lastPoint } = setup();

    pressKey(dialog, "z");
    lastPoint.value = { x: 10, y: 20 };
    pressKey(dialog, "z");
    expect(commands.toggleZoom.mock.calls).toEqual([[undefined], [{ x: 10, y: 20 }]]);
  });

  test("hears keys pressed outside its dialog and takes them from the browser", () => {
    const { commands } = setup();

    expect(pressKey(document.body, "ArrowRight").defaultPrevented).toBe(true);
    expect(commands.showNext).toHaveBeenCalledOnce();
  });

  test("brings focus back to its dialog when it acts", () => {
    const { dialog } = setup();
    const focus = vi.spyOn(dialog, "focus");

    pressKey(document.body, "ArrowRight");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  test("leaves unbound keys, inherited names, and browser shortcuts to the browser", () => {
    const { dialog, commands } = setup();
    const events = [
      pressKey(dialog, "x"),
      pressKey(dialog, "toString"),
      pressKey(dialog, "z", { ctrlKey: true }),
      pressKey(dialog, "ArrowRight", { metaKey: true }),
      pressKey(dialog, "ArrowRight", { altKey: true })
    ];

    expect(events.map(event => event.defaultPrevented)).toEqual([false, false, false, false, false]);
    expect(Object.values(commands).every(command => command.mock.calls.length === 0)).toBe(true);
  });

  test("leaves keys typed into a field alone", () => {
    const { commands } = setup();
    const field = document.createElement("input");

    document.body.append(field);
    onTestFinished(() => field.remove());
    expect(pressKey(field, "ArrowRight").defaultPrevented).toBe(false);
    expect(commands.showNext).not.toHaveBeenCalled();
  });

  describe("stop", () => {
    test("stops hearing keys", () => {
      const { keyboard, commands } = setup();

      keyboard.stop();
      pressKey(document.body, "ArrowRight");
      expect(commands.showNext).not.toHaveBeenCalled();
    });
  });
});
