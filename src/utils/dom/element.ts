export function elementWithId<K extends keyof HTMLElementTagNameMap>(tagName: K, id?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (id !== undefined) {
    element.id = id;
  }
  return element;
}

export function div(id?: string): HTMLDivElement {
  return elementWithId("div", id);
}

export function span(id?: string): HTMLSpanElement {
  return elementWithId("span", id);
}

export function label(id?: string): HTMLLabelElement {
  return elementWithId("label", id);
}

export function img(id?: string): HTMLImageElement {
  return elementWithId("img", id);
}

export function forceReflow(element: HTMLElement): void {
  element.getBoundingClientRect();
}

export function numberInput(id: string, min: number, max: number, step: number): HTMLInputElement {
  const input = elementWithId("input", id);

  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  return input;
}
