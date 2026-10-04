import { Control, ControlOptions } from "@/core/ui/control";

export const DisclosureClass = {
  root: "fsg-Disclosure",
  trigger: "fsg-Disclosure-trigger",
  title: "fsg-Disclosure-title",
  icon: "fsg-Disclosure-icon",
  content: "fsg-Disclosure-content"
} as const;

export type DisclosureSize = "medium" | "small";

export interface DisclosureOptions extends ControlOptions<boolean> {
  title: string;
  content: HTMLElement;
  size?: DisclosureSize;
}

export interface Disclosure extends Control<boolean> {
  readonly element: HTMLDivElement;
}

export function createDisclosure(ownerDocument: Document, { title, content, size = "medium", onValueChange }: DisclosureOptions): Disclosure {
  const element = ownerDocument.createElement("div");
  const trigger = createTrigger(ownerDocument, title);
  const region = ownerDocument.createElement("div");
  let isOpen = false;

  element.className = DisclosureClass.root;
  element.dataset.size = size;
  region.className = DisclosureClass.content;
  region.hidden = true;
  region.append(content);
  trigger.ariaControlsElements = [region];
  trigger.addEventListener("click", () => onValueChange(!isOpen));
  element.append(trigger, region);
  return {
    element,
    setValue: (value): void => {
      isOpen = value;
      trigger.setAttribute("aria-expanded", String(value));
      region.hidden = !value;
    },
    setDisabled: (disabled): void => {
      trigger.disabled = disabled;
    }
  };
}

function createTrigger(ownerDocument: Document, title: string): HTMLButtonElement {
  const trigger = ownerDocument.createElement("button");
  const titleElement = ownerDocument.createElement("span");
  const icon = ownerDocument.createElement("span");

  trigger.className = DisclosureClass.trigger;
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");
  titleElement.className = DisclosureClass.title;
  titleElement.textContent = title;
  icon.className = DisclosureClass.icon;
  icon.ariaHidden = "true";
  trigger.append(titleElement, icon);
  return trigger;
}
