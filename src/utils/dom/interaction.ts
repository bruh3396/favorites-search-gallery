import { typeableInputs } from "../../types/guards";

function isTypeableInput(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === "textarea" || (tagName === "input" && typeableInputs.has(element.getAttribute("type") ?? ""));
}

export function isHotkeyEvent(event: KeyboardEvent): boolean {
  return !event.repeat && event.target instanceof HTMLElement && !isTypeableInput(event.target) && !event.ctrlKey;
}

export function hasTagName(element: HTMLElement | EventTarget, tagName: string): boolean {
  return element instanceof HTMLElement && element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
}

export function blurActiveElement(): void {
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
