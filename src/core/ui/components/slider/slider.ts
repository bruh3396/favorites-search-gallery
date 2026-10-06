import { Control, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";

export const SliderClass = {
  root: "fsg-Slider",
  input: "fsg-Slider-input"
} as const;

export interface SliderOptions extends ControlOptions<number> {
  label: string;
  min: number;
  max: number;
  step?: number;
  onValueCommit?: (value: number) => void;
}

export interface Slider extends Control {
  readonly element: HTMLDivElement;
}

export function createSlider(
  ownerDocument: Document,
  { label, min, max, step = 1, size = "medium", value, disabled = NEVER_DISABLED, onValueChange, onValueCommit = (): void => undefined }: SliderOptions
): Slider {
  const element = ownerDocument.createElement("div");
  const input = ownerDocument.createElement("input");

  element.className = SliderClass.root;
  element.dataset.size = size;
  input.className = SliderClass.input;
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.setAttribute("aria-label", label);
  element.append(input);
  input.addEventListener("input", () => {
    if (input.valueAsNumber !== value.peek()) {
      onValueChange(input.valueAsNumber);
    }
  });
  input.addEventListener("change", () => onValueCommit(input.valueAsNumber));

  const dispose = effect(() => {
    input.value = String(value.value);
    input.disabled = disabled.value;
  });
  return { element, dispose };
}
