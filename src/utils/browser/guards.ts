import { TypeableInput } from "@/types/input";

const typeableInputs: ReadonlySet<TypeableInput> = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);

export function isHotkeyEvent(event: KeyboardEvent): boolean {
  return !event.repeat && event.target instanceof HTMLElement && !isTypeableInput(event.target) && !event.ctrlKey;
}

export function hasTagName(element: HTMLElement | EventTarget, tagName: string): boolean {
  return element instanceof HTMLElement && element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
}

export function isInside(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

function isTypeableInput(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === "textarea" || (tagName === "input" && typeableInputs.has((element.getAttribute("type") ?? "") as TypeableInput));
}
