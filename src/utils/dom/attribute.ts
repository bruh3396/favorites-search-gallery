export function setDataset(element: HTMLElement | null, name: string, value: string): void {
  if (element !== null) {
    element.dataset[name] = value;
  }
}

export function removeDataset(element: HTMLElement | null, name: string): void {
  if (element !== null) {
    delete element.dataset[name];
  }
}
