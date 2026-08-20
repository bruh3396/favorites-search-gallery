interface ElementOptions {
  id?: string;
  className?: string;
  textContent?: string;
  dataset?: Record<string, string>;
  children?: (Node | string)[];
}

export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options: ElementOptions = {}): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.id !== undefined) {
    element.id = options.id;
  }

  if (options.className !== undefined) {
    element.className = options.className;
  }

  if (options.textContent !== undefined) {
    element.textContent = options.textContent;
  }

  if (options.dataset !== undefined) {
    for (const [key, value] of Object.entries(options.dataset)) {
      element.dataset[key] = value;
    }
  }

  if (options.children !== undefined) {
    element.append(...options.children);
  }
  return element;
}

export function elementWithId<K extends keyof HTMLElementTagNameMap>(tagName: K, id?: string): HTMLElementTagNameMap[K] {
  return createElement(tagName, { id });
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
