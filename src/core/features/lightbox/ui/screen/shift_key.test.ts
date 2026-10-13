import { describe, expect, onTestFinished, test } from "vitest";
import { LightboxShiftKey } from "@/core/features/lightbox/ui/screen/shift_key";

function setup(): LightboxShiftKey {
  const shiftKey = new LightboxShiftKey();

  shiftKey.start(document);
  onTestFinished(() => shiftKey.stop());
  return shiftKey;
}

function pressShift(): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }));
}

function releaseShift(): void {
  document.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
}

describe("LightboxShiftKey", () => {
  test("reports Shift held between its keydown and keyup", () => {
    const shiftKey = setup();
    const states: boolean[] = [];

    pressShift();
    states.push(shiftKey.isHeld.value);
    releaseShift();
    states.push(shiftKey.isHeld.value);
    expect(states).toEqual([true, false]);
  });

  test("reads Shift from a pointer move", () => {
    const shiftKey = setup();

    document.dispatchEvent(new PointerEvent("pointermove", { shiftKey: true }));
    expect(shiftKey.isHeld.value).toBe(true);
  });

  test("releases Shift when the window loses focus", () => {
    const shiftKey = setup();

    pressShift();
    window.dispatchEvent(new Event("blur"));
    expect(shiftKey.isHeld.value).toBe(false);
  });

  test("releases Shift and stops listening once stopped", () => {
    const shiftKey = setup();

    pressShift();
    shiftKey.stop();
    pressShift();
    expect(shiftKey.isHeld.value).toBe(false);
  });
});
