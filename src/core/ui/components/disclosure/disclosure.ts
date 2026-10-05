import { Control, ControlOptions, NEVER_DISABLED } from "@/core/ui/components/control";
import { effect } from "@/core/utils/reactive/signal";

export const DisclosureClass = {
  root: "fsg-Disclosure",
  trigger: "fsg-Disclosure-trigger",
  title: "fsg-Disclosure-title",
  icon: "fsg-Disclosure-icon",
  content: "fsg-Disclosure-content"
} as const;

export interface DisclosureOptions extends ControlOptions<boolean> {
  title: string;
  content: HTMLElement;
}

export interface Disclosure extends Control {
  readonly element: HTMLDivElement;
}

export function createDisclosure(
  ownerDocument: Document,
  { title, content, value, disabled = NEVER_DISABLED, size = "medium", onValueChange }: DisclosureOptions
): Disclosure {
  const element = ownerDocument.createElement("div");
  const trigger = createTrigger(ownerDocument, title);
  const region = ownerDocument.createElement("div");

  element.className = DisclosureClass.root;
  element.dataset.size = size;
  region.className = DisclosureClass.content;
  region.append(content);
  trigger.ariaControlsElements = [region];
  trigger.addEventListener("click", () => onValueChange(!value.peek()));
  element.append(trigger, region);

  const disposeValue = effect(() => {
    const isOpen = value.value;

    trigger.setAttribute("aria-expanded", String(isOpen));
    region.hidden = !isOpen;
  });
  const disposeDisabled = effect(() => {
    trigger.disabled = disabled.value;
  });
  return {
    element,
    dispose: (): void => {
      disposeValue();
      disposeDisabled();
    }
  };
}

function createTrigger(ownerDocument: Document, title: string): HTMLButtonElement {
  const trigger = ownerDocument.createElement("button");
  const titleElement = ownerDocument.createElement("span");
  const icon = ownerDocument.createElement("span");

  trigger.className = DisclosureClass.trigger;
  trigger.type = "button";
  titleElement.className = DisclosureClass.title;
  titleElement.textContent = title;
  icon.className = DisclosureClass.icon;
  icon.ariaHidden = "true";
  trigger.append(titleElement, icon);
  return trigger;
}
