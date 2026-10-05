import { Switch, SwitchClass, SwitchOptions, createSwitch } from "@/core/ui/components/switch/switch";
import { describe, expect, test, vi } from "vitest";
import SWITCH_CSS from "@/core/ui/components/switch/switch.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup extends Switch {
  value: Signal<boolean>;
  disabled: Signal<boolean>;
  onValueChange: (next: boolean) => void;
}

function setup(options: Partial<SwitchOptions> = {}): Setup {
  const value = new Signal(false);
  const disabled = new Signal(false);
  const onValueChange = vi.fn();
  return { ...createSwitch(document, { value, disabled, onValueChange, ...options }), value, disabled, onValueChange };
}

describe("createSwitch", () => {
  test("is a switch button showing its value", () => {
    const { element } = setup();

    expect(element.getAttribute("role")).toBe("switch");
    expect(element.type).toBe("button");
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ size: "small" }).element.dataset.size).toBe("small");
  });

  test("reports the flipped value on click without changing itself", () => {
    const { element, onValueChange } = setup();

    element.click();
    expect(onValueChange).toHaveBeenLastCalledWith(true);
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("flips from its current value", () => {
    const { element, value, onValueChange } = setup();

    value.value = true;
    element.click();
    expect(onValueChange).toHaveBeenLastCalledWith(false);
  });

  test("follows its value", () => {
    const { element, value } = setup();

    value.value = true;
    expect(element.getAttribute("aria-checked")).toBe("true");
    value.value = false;
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("ignores clicks while disabled", () => {
    const { element, disabled, onValueChange } = setup();

    disabled.value = true;
    element.click();
    expect(element.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("is enabled unless given a disabled state", () => {
    const { element } = createSwitch(document, { value: new Signal(false), onValueChange: vi.fn() });

    expect(element.disabled).toBe(false);
  });

  test("stops following its value once disposed", () => {
    const { element, value, dispose } = setup();

    dispose();
    value.value = true;
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SwitchClass, SWITCH_CSS);
  });
});
