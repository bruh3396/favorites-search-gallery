export const SwitchClass = {
  root: "setting-switch",
  thumb: "setting-switch-thumb"
} as const;

export type SwitchSize = "medium" | "small";

export interface SwitchOptions {
  onToggle: () => void;
  size?: SwitchSize;
}

export interface Switch {
  readonly element: HTMLButtonElement;
  setChecked: (checked: boolean) => void;
  setDisabled: (disabled: boolean) => void;
}

export function createSwitch(ownerDocument: Document, { onToggle, size = "medium" }: SwitchOptions): Switch {
  const thumb = ownerDocument.createElement("span");
  const element = ownerDocument.createElement("button");

  thumb.className = SwitchClass.thumb;
  element.className = SwitchClass.root;
  element.type = "button";
  element.dataset.size = size;
  element.setAttribute("role", "switch");
  element.setAttribute("aria-checked", "false");
  element.append(thumb);
  element.addEventListener("click", () => onToggle());
  return {
    element,
    setChecked: (checked) => element.setAttribute("aria-checked", String(checked)),
    setDisabled: (disabled): void => {
      element.disabled = disabled;
    }
  };
}
