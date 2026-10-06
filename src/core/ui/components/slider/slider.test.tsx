import { Slider, SliderClass } from "@/core/ui/components/slider/slider";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SLIDER_CSS from "@/core/ui/components/slider/slider.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  input: HTMLInputElement;
  dispose: () => void;
  value: Signal<number>;
  disabled: Signal<boolean>;
  onValueChange: (next: number) => void;
  onValueCommit: (value: number) => void;
}

function setup(): Setup {
  const value = new Signal(5);
  const disabled = new Signal(false);
  const onValueChange = vi.fn<(next: number) => void>();
  const onValueCommit = vi.fn<(value: number) => void>();
  const { result, dispose } = render(document, () => (
    <Slider label="Size" min={1} max={20} step={0.5} value={value} disabled={disabled} onValueChange={onValueChange} onValueCommit={onValueCommit} />
  ));
  return { input: result.querySelector("input")!, dispose, value, disabled, onValueChange, onValueCommit };
}

function drag(input: HTMLInputElement, to: number): void {
  input.value = String(to);
  input.dispatchEvent(new Event("input"));
}

describe("Slider", () => {
  test("draws a labelled range input with its bounds", () => {
    const { input } = setup();

    expect(input.type).toBe("range");
    expect(input.getAttribute("aria-label")).toBe("Size");
    expect([input.min, input.max, input.step]).toEqual(["1", "20", "0.5"]);
  });

  test("shows the value and follows it", () => {
    const { input, value } = setup();

    expect(input.value).toBe("5");
    value.value = 7.5;
    expect(input.value).toBe("7.5");
  });

  test("reports every value while dragging", () => {
    const { input, onValueChange } = setup();

    drag(input, 6);
    drag(input, 6.5);
    expect(onValueChange).toHaveBeenNthCalledWith(1, 6);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 6.5);
  });

  test("commits the value once it is let go", () => {
    const { input, onValueCommit } = setup();

    drag(input, 6);
    input.dispatchEvent(new Event("change"));
    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(6);
  });

  test("follows being disabled", () => {
    const { input, disabled } = setup();

    disabled.value = true;
    expect(input.disabled).toBe(true);
  });

  test("stops following once disposed", () => {
    const { input, value, dispose } = setup();

    dispose();
    value.value = 9;
    expect(input.value).toBe("5");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SliderClass, SLIDER_CSS);
  });
});
