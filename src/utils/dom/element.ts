export function elementWithId<K extends keyof HTMLElementTagNameMap>(tagName: K, id: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  element.id = id;
  return element;
}

export function div(id: string): HTMLDivElement {
  return elementWithId("div", id);
}

export function span(id: string): HTMLSpanElement {
  return elementWithId("span", id);
}

export function label(id: string): HTMLLabelElement {
  return elementWithId("label", id);
}
