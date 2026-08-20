import { TypeableInput } from "@/types/input";
import { typeableInputs } from "@/types/guards";

export function isHotkeyEvent(event: KeyboardEvent): boolean {
  return !event.repeat && event.target instanceof HTMLElement && !isTypeableInput(event.target) && !event.ctrlKey;
}

export function hasTagName(element: HTMLElement | EventTarget, tagName: string): boolean {
  return element instanceof HTMLElement && element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
}

function isTypeableInput(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === "textarea" || (tagName === "input" && typeableInputs.has((element.getAttribute("type") ?? "") as TypeableInput));
}
