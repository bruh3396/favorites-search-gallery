import { Control, ControlOptions } from "@/core/ui/control";

export const SwitchClass = {
  root: "fsg-Switch",
  thumb: "fsg-Switch-thumb"
} as const;

export type SwitchSize = "medium" | "small";

export interface SwitchOptions extends ControlOptions<boolean> {
  size?: SwitchSize;
}

export interface Switch extends Control<boolean> {
  readonly element: HTMLButtonElement;
}

export function createSwitch(ownerDocument: Document, { onValueChange, size = "medium" }: SwitchOptions): Switch {
  const thumb = ownerDocument.createElement("span");
  const element = ownerDocument.createElement("button");
  let isChecked = false;

  thumb.className = SwitchClass.thumb;
  element.className = SwitchClass.root;
  element.type = "button";
  element.dataset.size = size;
  element.setAttribute("role", "switch");
  element.setAttribute("aria-checked", "false");
  element.append(thumb);
  element.addEventListener("click", () => onValueChange(!isChecked));
  return {
    element,
    setValue: (value): void => {
      isChecked = value;
      element.setAttribute("aria-checked", String(value));
    },
    setDisabled: (disabled): void => {
      element.disabled = disabled;
    }
  };
}
