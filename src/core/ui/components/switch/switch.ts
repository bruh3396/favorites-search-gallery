import { Control, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";

export const SwitchClass = {
  root: "fsg-Switch",
  thumb: "fsg-Switch-thumb"
} as const;

export type SwitchOptions = ControlOptions<boolean>;

export interface Switch extends Control {
  readonly element: HTMLButtonElement;
}

export function createSwitch(ownerDocument: Document, { value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: SwitchOptions): Switch {
  const thumb = ownerDocument.createElement("span");
  const element = ownerDocument.createElement("button");

  thumb.className = SwitchClass.thumb;
  element.className = SwitchClass.root;
  element.type = "button";
  element.dataset.size = size;
  element.setAttribute("role", "switch");
  element.append(thumb);
  element.addEventListener("click", () => onValueChange(!value.peek()));

  const disposeValue = effect(() => element.setAttribute("aria-checked", String(value.value)));
  const disposeDisabled = effect(() => {
    element.disabled = disabled.value;
  });
  return {
    element,
    dispose: (): void => {
      disposeValue();
      disposeDisabled();
    }
  };
}
