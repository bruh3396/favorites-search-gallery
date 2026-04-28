const TYPEABLE_INPUTS = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);

function isTypeableInput(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === "textarea" || (tagName === "input" && TYPEABLE_INPUTS.has(element.getAttribute("type") ?? ""));
}

export function isHotkeyEvent(event: KeyboardEvent): boolean {
  return !event.repeat && event.target instanceof HTMLElement && !isTypeableInput(event.target) && !event.ctrlKey;
}

export function hasTagName(element: HTMLElement | EventTarget, tagName: string): boolean {
  return element instanceof HTMLElement && element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
}

export function getRectDistance(rect1: DOMRectReadOnly, rect2: DOMRectReadOnly): number {
  const x1 = rect1.left + (rect1.width / 2);
  const y1 = rect1.top + (rect1.height / 2);
  const x2 = rect2.left + (rect2.width / 2);
  const y2 = rect2.top + (rect2.height / 2);
  return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
}

export function blurCurrentlyFocusedElement(): void {
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
